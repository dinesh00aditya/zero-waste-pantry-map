import { GoogleGenAI } from "@google/genai";
import { PantryItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function getRecipeSuggestions(items: PantryItem[]) {
  if (items.length === 0) return "Add some items to your pantry to get recipe suggestions!";

  const prompt = `I have the following ingredients in my pantry: ${items.map(i => `${i.quantity} ${i.unit} of ${i.name}`).join(', ')}. 
  Based on these, suggest 3 creative, zero-waste recipes. 
  Focus on using ingredients that are closest to their expiry date if any.
  Return only a JSON array of objects with fields: title, ingredients (array of strings), instructions (array of strings), and difficulty (easy/medium/hard).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
}
