import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: "AIzaSyFakeKey1234567890" });
async function run() {
  try {
    await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: 'hello'
    });
  } catch (e) {
    console.log(e.message);
  }
}
run();
