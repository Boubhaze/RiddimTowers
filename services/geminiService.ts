import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getDubLesson = async (topic: string): Promise<string> => {
  if (!apiKey) return "API Key not configured. Unable to fetch lesson.";

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are a legendary Dub Sound System operator and historian (like Jah Shaka or King Tubby).
      Explain the following concept to a beginner in a mystical, technical, yet accessible way.
      Keep it short (max 2 paragraphs). Use bolding for emphasis.
      
      Topic: ${topic}
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "Jah guide, try again later.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The system is overheating. Check your connections (API Error).";
  }
};
