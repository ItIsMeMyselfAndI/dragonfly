import { GoogleGenAI } from "@google/genai";
import { BomExtractionSchema } from "@/lib/schemas/bomSchema";
import { resolveComponentPricing } from "@/lib/pricing";
import { ItemModel, StockStatus } from "@/lib/apis/inventory/types";
import { type BomAlert } from "@/features/bom/data";
import { ProjectTagEnum } from "@/lib/apis/project/types";
import { createItem } from "@/lib/apis/inventory/client";
import { getNextApiKey } from "./keyCycler";

// Helper for deterministic IDs
function slugify(text: string) {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export async function generateBomLogic(
  prompt: string | null,
  image: File | null,
) {
  const ai = new GoogleGenAI({ apiKey: getNextApiKey() });
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
  if (prompt) {
    contents.push({ text: prompt });
  }

  // 2. Call Gemini for Nodal Computation & Extraction
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: contents,
    config: {
      systemInstruction: `You are an expert Electronics Engineer and System Architect. Your task is to generate a professional Bill of Materials (BOM) based on a provided technical specifications analysis and an optional schematic image.

CRITICAL INSTRUCTIONS:
1. Source of Truth: The provided "RELEVANT SPECS ANALYSIS" is your PRIMARY SOURCE OF TRUTH. Use the components and calculated electrical requirements (Voltage, Current, Power) defined in the specs to identify the necessary parts.
2. Component Mapping: For every component listed in the specs, find a matching, real-world industrial part number that meets or exceeds the specified electrical ratings.
3. Smart Selection: Ensure the parts selected are purchasable and robust. If the specs indicate a high-power requirement, ensure the selected part number is rated for that specific load.
4. Accuracy: Provide exact, valid manufacturer part numbers.
5. Alerts: Cross-reference the specs and the schematic. If you detect a missing flyback diode for an inductive load or a voltage logic mismatch (e.g., 5V logic triggering a 3.3V IC without a level shifter), add a compatibility alert.`,
      responseMimeType: "application/json",
      responseSchema: BomExtractionSchema,
    },
  });

  // Parse the structured JSON response
  const extraction = JSON.parse(response.text || "{}") as {
    items: ItemModel[];
    alerts: BomAlert[];
    tag: ProjectTagEnum;
  };
  const extractedItems = extraction.items || [];

  // 3. Pricing Engine & Inventory Creation Logic
  const itemsWithPricing = await Promise.all(
    extractedItems.map(async (item: ItemModel, index: number) => {
      // Run real web search / scraping
      const storeOptions = await resolveComponentPricing(
        item.name,
        item.partNumber,
      );

      // Find the cheapest to set as default
      const cheapestOption =
        storeOptions.find((s) => s.isCheapest) || storeOptions[0];

      const itemData = {
        ...item,
        // Deterministic ID for consistency: component name slugified
        id: `c-gen-${slugify(item.name)}`,
        storeOptions,
        // Hydrate the default frontend expectations based on cheapest option
        unitPrice: cheapestOption ? cheapestOption.price : 0,
        stock: cheapestOption?.inStock ? StockStatus.IN_STOCK : StockStatus.OUT,
      };

      // Simulate inventory creation
      try {
        await createItem({
            ...itemData,
            qty: 0,
            stockCount: cheapestOption?.inStock ? 100 : 0,
            pins: [],
        });
      } catch (err) {
        console.warn(`Could not sync item to inventory: ${item.name}`, err);
      }

      return itemData;
    }),
  );

  return {
    items: itemsWithPricing,
    alerts: extraction.alerts || [],
    tag: extraction.tag || "N/A",
  };
}
