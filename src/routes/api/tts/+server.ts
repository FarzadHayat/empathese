import type { RequestHandler } from './$types';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

function getAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    return new GoogleGenAI({ apiKey });
}

function createWavBuffer(pcmData: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const header = Buffer.alloc(44);

    header.write('RIFF', 0);
    header.writeUInt32LE(36 + pcmData.length, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(pcmData.length, 40);

    return Buffer.concat([header, pcmData]);
}

export const POST: RequestHandler = async ({ request }) => {
    let text: string;
    try {
        const body = await request.json();
        text = body?.text;
    } catch {
        return new Response('Invalid JSON body', {
            status: 400,
            headers: { 'Content-Type': 'text/plain' },
        });
    }

    if (!text || typeof text !== 'string') {
        return new Response('Invalid request: text is required', {
            status: 400,
            headers: { 'Content-Type': 'text/plain' },
        });
    }

    const ai = getAI();

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: 'Kore',
                        },
                    },
                },
            },
        });

        const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (!inlineData?.data) {
            return new Response('No audio data in response', {
                status: 500,
                headers: { 'Content-Type': 'text/plain' },
            });
        }

        const pcmData = Buffer.from(inlineData.data, 'base64');
        const wavBuffer = createWavBuffer(pcmData);

        return new Response(new Uint8Array(wavBuffer), {
            headers: { 'Content-Type': 'audio/wav' },
        });
    } catch (err) {
        console.error('TTS error:', err);
        return new Response('Text-to-speech failed', {
            status: 500,
            headers: { 'Content-Type': 'text/plain' },
        });
    }
};
