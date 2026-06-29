import { GoogleGenAI } from "@google/genai";
import { SpecsExtractionSchema } from "./specsSchema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateSpecsLogic(prompt: string | null, image: File | null) {
  const contents = [];
  if (image) {
    const buffer = Buffer.from(await image.arrayBuffer());
    contents.push({
      inlineData: {
        data: buffer.toString("base64"),
        mimeType: image.type,
      },
    });
  }
  if (prompt) contents.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contents,
    config: {
      systemInstruction: `You are an expert Electronics Engineer. Analyze the schematic/description. 
      For every component, perform the calculation. 
      Return JSON with this structure:
      {
        "specs": [
          {
            "componentName": string,
            "computedSpecs": string,
            "reasoning": string,
            "calculation": { "formula": string, "result": string }
          }
        ],
        "summary": string
      }`,
      responseMimeType: "application/json",
      responseSchema: SpecsExtractionSchema,
    },
  });

  return JSON.parse(response.text || "{}");
}
