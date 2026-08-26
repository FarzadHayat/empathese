import type { RequestHandler } from "./$types";
import { GoogleGenAI } from "@google/genai";
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const apiKey = env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY environment variable is not set');
        }
        const ai = new GoogleGenAI({ apiKey });

        const blob = await request.blob();
        if (blob.size === 0) {
            return new Response('Invalid audio data', { status: 400 });
        }

        const arrayBuffer = await blob.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = (blob.type || 'audio/ogg').split(';')[0].trim() || 'audio/ogg';

        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        { inlineData: { mimeType, data: base64Audio } },
                        { text: 'Transcribe the audio to text. Only output the transcribed text with no additional commentary.' },
                    ],
                },
            ],
        });

        return new Response(result.text ?? '');
    } catch (err: any) {
        console.error('Dictation error:', err);
        return new Response('Transcription failed: ' + (err.message || 'Unknown error'), {
            status: 500,
            headers: { 'Content-Type': 'text/plain' },
        });
    }
}
