import type { RequestHandler } from "./$types";
import Groq from "groq-sdk";
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const apiKey = env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error('GROQ_API_KEY environment variable is not set');
        }
        
        const { text } = await request.json();
        if (!text) {
            return new Response('No text provided', { status: 400 });
        }

        const groq = new Groq({ apiKey });

        const result = await groq.audio.speech.create({
            model: "canopylabs/orpheus-v1-english",
            input: text,
            voice: "diana",
            response_format: "wav",
        });

        const arrayBuffer = await result.arrayBuffer();

        return new Response(arrayBuffer, {
            headers: {
                "Content-Type": "audio/wav",
            },
        });
    } catch (err: any) {
        console.error('TTS error:', err);
        return new Response('TTS failed: ' + (err.message || 'Unknown error'), {
            status: 500,
            headers: { 'Content-Type': 'text/plain' },
        });
    }
}
