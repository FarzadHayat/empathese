import type { Actions, PageServerLoad } from './$types';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { redirect } from '@sveltejs/kit';
dotenv.config();

function getAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    return new GoogleGenAI({ apiKey });
}

export const load: PageServerLoad = ({request}) => {
    if (request.method != "POST") {
        redirect(302, "/");
    }
}

export const actions = {
    default: async ({ cookies, request }) => {
        const ai = getAI();
        // Getting the user's input
        const data = await request.formData();
        const yourMessage = data.get("yourMessage")?.toString();
        const theirMessage = data.get("theirMessage")?.toString();
        const relationship = data.get("relationship")?.toString().toLowerCase();
        const responseQuality = data.get("quality")?.toString().toLowerCase();

        // Quality of response
        let responseQualityString = `You are a helpful conversation companion who helps me understand my conversation with my ${relationship} and uncover what my ${relationship} really means when they says something to me.`;
        if (responseQuality == "brutal") {
            responseQualityString = `You are a helpful conversation companion who helps me understand my conversation with my ${relationship} BUT you give the opposite intrepertation in a brutally harsh manner to what they actually meant and give insulting response suggestions.`;
        }

        // Response format
        const responseFormat = `<your interpretation of their response as a string>;<first ${responseQuality} suggestion for a response that I could say to them as string>;<second ${responseQuality} suggestion for a response that I could say to them as string>;<third ${responseQuality} suggestion for a response that I could say to them as string>`;

        // Setting up the scenario
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
        console.log(prompt);

        // API call
        const result = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
    
        // Parsing the response
        const response = result.text || "NA;NA;NA;NA";
        console.log(response);
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