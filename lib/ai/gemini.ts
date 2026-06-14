import { GoogleGenAI, Type } from '@google/genai';
import { EXTRACTION_PROMPT } from './prompt';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function geminiExtract(text: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `${EXTRACTION_PROMPT}\n\n---\n\n${text}`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          email:    { type: Type.STRING, nullable: true },
          phone:    { type: Type.STRING, nullable: true },
          location: { type: Type.STRING, nullable: true },
        },
        required: ['email', 'phone', 'location'],
      },
    },
  });

  const raw = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('Gemini returned no text content');
  return JSON.parse(raw) as { email: string | null; phone: string | null; location: string | null };
}