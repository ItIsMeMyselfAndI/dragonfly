import { GoogleGenAI } from "@google/genai";
import { BomExtractionSchema } from "@/lib/apis/generate/bomSchema";
import { GeneratedBOM } from "./types";
import { getNextApiKey } from "./keyCycler";
import { normalizeGenerationTimestamp, runWithModelFallback } from "./utils";

export async function generateBomLogic(
  specsContext: string | null,
  image: File | null,
  projectId: string,
  generationTimestamp?: string,
): Promise<GeneratedBOM> {
  const ai = new GoogleGenAI({ apiKey: getNextApiKey() });
  const generationSuffix = normalizeGenerationTimestamp(generationTimestamp);

  // 1. Prepare inputs for Gemini
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
  if (specsContext) {
    contents.push({
      text: `
      RELEVANT SPECS ANAYSIS {
      ${specsContext}
      }
      `,
    });
  }

  // 2. Call Gemini for Nodal Computation & Extraction
  const generatedBOM = await runWithModelFallback(
    ai,
    contents,
    {
      systemInstruction: `You are an expert Electronics Engineer and System Architect. Your task is to generate a professional Bill of Materials (BOM) based on a provided technical specifications analysis and an optional schematic image.

      CRITICAL INSTRUCTIONS:
      1. Source of Truth: The provided "RELEVANT SPECS ANALYSIS" is your PRIMARY SOURCE OF TRUTH.
      2. Component Mapping: Find matching, real-world industrial part numbers.
      3. Formatting: Generate a concise 'shortDesc' (format: "7.4V · 2600mAh · JST").
      4. Structured Details: Populate 'details' with ALL applicable technical fields (mounting, package, voltages, current rating, etc.) available from the schematic or common knowledge for the selected part. DO NOT LEAVE DETAILS EMPTY.
      5. Alerts: Cross-reference the specs and the schematic for compatibility alerts.
      6. Generate Items: Populate new array of inventory items with unique ID's following this pattern: item-{index}-${generationSuffix}.
      7. Generate Components: Populate new array of project components with unique ID's following this pattern: comp-{index}-${projectId}.
      8. ID Consistency: Ensure the 'inventoryId' in components and the item.details matches the corresponding generated item ID.
      9. Pricing (PHP): Estimate realistic retail unit prices in Philippine Peso (PHP). Provide numerical float values only.
      10. Stock Simulation (CRITICAL): Intelligently assign 'stock' status based on real-world electronics market trends (e.g., highly sought-after microcontrollers, niche sensors, or chips affected by shortages are more likely to be out of stock, whereas basic resistors are usually in stock). YOU MUST SET AT LEAST ONE ITEM TO OUT OF STOCK.
      11. Entity Consistency: The 'unitPrice', 'stock' status, and 'stockCount' (which must be 0 if out of stock) MUST perfectly match between the 'items' array and the 'components' array for the corresponding inventoryId.`,
      responseMimeType: "application/json",
      responseSchema: BomExtractionSchema,
    },
    (text) => JSON.parse(text || "{}") as GeneratedBOM,
  );

  return generatedBOM;
}
