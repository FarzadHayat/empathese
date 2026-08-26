import type { Actions, PageServerLoad } from './$types';
import Groq from 'groq-sdk';
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

function getAI() {
    const apiKey = env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error('GROQ_API_KEY environment variable is not set');
    }
    return new Groq({ apiKey });
}

export const load: PageServerLoad = ({request}) => {
    if (request.method != "POST") {
        redirect(302, "/");
    }
}

export const actions = {
    default: async ({ request }) => {
        const ai = getAI();
        const data = await request.formData();
        const yourMessage = data.get("yourMessage")?.toString();
        const theirMessage = data.get("theirMessage")?.toString();
        const relationship = data.get("relationship")?.toString().toLowerCase();
        const responseQuality = data.get("quality")?.toString().toLowerCase();

        let responseQualityString = `You are a helpful conversation companion who helps me understand my conversation with my ${relationship} and uncover what my ${relationship} really means when they says something to me.`;
        if (responseQuality == "brutal") {
            responseQualityString = `You are a helpful conversation companion who helps me understand my conversation with my ${relationship} BUT you give the opposite intrepertation in a brutally harsh manner to what they actually meant and give insulting response suggestions.`;
        }

        const responseFormat = `<your interpretation of their response as a string>;<first ${responseQuality} suggestion for a response that I could say to them as string>;<second ${responseQuality} suggestion for a response that I could say to them as string>;<third ${responseQuality} suggestion for a response that I could say to them as string>`;

        const prompt =
        `${responseQualityString}
        I will give you a scenario of what I said and what they said.
        Give a response including an interpretation of what they said from your point of view speaking to me, along with three suggestions for possible responses I could say to them from my point of view.
        Respond in the following format:

        ${responseFormat}
        
        Don't give explanation or extra boilerplate around your response. Only include the format above in your response.

        I said: ${yourMessage}
        They said: ${theirMessage}
        Relationship: ${relationship}`;

        // Groq API call
        const chatCompletion = await ai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.5,
        });
    
        const response = chatCompletion.choices[0]?.message?.content || "NA;NA;NA;NA";
        const stringArray = response.split(";");

        const translation = stringArray[0];
        const suggestions = stringArray.slice(1);
        
        return {
            yourMessage,
            theirMessage,
            relationship,
            responseQuality,
            translation,
            suggestions,
        };
    },
} satisfies Actions;