import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function createEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

export async function extractCarFeatures(query: string): Promise<{
  brand?: string;
  type?: string;
  maxPrice?: number;
  minPrice?: number;
  fuelType?: string;
  features: string[];
}> {
  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content: `You are an automotive expert. Extract structured information from user's car search query. 
        Return JSON with: brand (optional), type (SUV/Sedan/Sports/Coupe/Electric/Truck), maxPrice (number), minPrice (number), fuelType (Gas/Electric/Hybrid), features (array of desired features).
        If prices mentioned, extract numeric values. If not mentioned, set to null.`,
      },
      {
        role: "user",
        content: query,
      },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}
