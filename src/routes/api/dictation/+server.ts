import type { RequestHandler } from "./$types";
import Groq from "groq-sdk";
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const apiKey = env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error('GROQ_API_KEY environment variable is not set');
        }
        const groq = new Groq({ apiKey });

        const blob = await request.blob();
        if (blob.size === 0) {
            return new Response('Invalid audio data', { status: 400 });
        }

        const file = new File([blob], 'audio.ogg', { type: blob.type || 'audio/ogg' });

        const result = await groq.audio.transcriptions.create({
            file,
            model: 'whisper-large-v3',
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
