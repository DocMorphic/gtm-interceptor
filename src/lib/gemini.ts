import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const gemini = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function geminiJSON<T>(prompt: string): Promise<T> {
  const result = await gemini.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const text = result.response.text();
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    console.error("Failed to parse Gemini JSON output (Make.com likely rate-limited the web search request):", text.substring(0, 100));
    // Soft fallback so downstream `extracted.companies` or `extracted.contacts` iterations don't crash
    return { companies: [], contacts: [] } as unknown as T;
  }
}
