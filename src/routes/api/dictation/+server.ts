import type { RequestHandler } from "./$types";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

function getAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    return new GoogleGenAI({ apiKey });
}

export const POST: RequestHandler = async ({ url, request }) => {
    const ai = getAI();
    const blob = await request.blob();

    if (blob.size === 0) {
        return new Response('Invalid audio data', {
            status: 400,
            headers: { 'Content-Type': 'text/plain' },
        });
    }

    try {
        const arrayBuffer = await blob.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');

        // Normalise the MIME type: strip codec parameters and fall back to
        // 'audio/ogg' so the Gemini API always receives a supported value.
        const mimeType = (blob.type || 'audio/ogg').split(';')[0].trim() || 'audio/ogg';

        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        {
                            inlineData: {
                                mimeType,
                                data: base64Audio,
                            },
                        },
                        { text: 'Transcribe the audio to text. Only output the transcribed text with no additional commentary.' },
                    ],
                },
            ],
        });

        return new Response(result.text ?? '');
    } catch (err) {
        console.error('Dictation error:', err);
        return new Response('Transcription failed', {
            status: 500,
            headers: { 'Content-Type': 'text/plain' },
        });
    }
}
