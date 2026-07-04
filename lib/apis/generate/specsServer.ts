import { GoogleGenAI } from "@google/genai";
import { SpecsExtractionSchema } from "./specsSchema";
import { getNextApiKey } from "./keyCycler";
import { GeneratedSpecs } from "./types";
import { runWithModelFallback } from "./utils";

export async function generateSpecsLogic(
  prompt: string | null,
  image: File | null,
): Promise<GeneratedSpecs> {
  const ai = new GoogleGenAI({ apiKey: getNextApiKey() });
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

  const generatedSpecs = await runWithModelFallback(
    ai,
    contents,
    {
      systemInstruction: `
      You are an expert Electronics Engineer. Analyze the schematic/description. 
      For every component, perform the calculation. 
      CRITICAL: ONLY USE ASCII CHARACTERS. Do not use special symbols like Greek letters, mathematical symbols (e.g., Ω, η), or non-ASCII characters. Replace them with their ASCII equivalent (e.g., replace 'Ω' with 'Ohm', 'η' with 'eta').
      `,
      responseMimeType: "application/json",
      responseSchema: SpecsExtractionSchema,
    },
    (text) => JSON.parse(text || "{}") as GeneratedSpecs,
  );
  return generatedSpecs;
}
