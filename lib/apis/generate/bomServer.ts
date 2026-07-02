import { GoogleGenAI } from "@google/genai";
import { BomExtractionSchema } from "@/lib/apis/generate/bomSchema";
import { resolveComponentPricing } from "@/lib/pricing";
import {
  ItemModel,
  StockStatus,
  ItemCategory,
} from "@/lib/apis/inventory/types";
import { type BomAlert } from "@/features/bom/data";
import { ProjectTagEnum } from "@/lib/apis/project/types";
import { GeneratedBOM, GeneratedBOMItem } from "./types";
import { createItem } from "@/lib/apis/inventory/client";
import { getNextApiKey } from "./keyCycler";
import { runWithModelFallback } from "./utils";

// Helper for deterministic IDs
function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

function normalizeGenerationTimestamp(generationTimestamp?: string): string {
  if (!generationTimestamp) {
    return Date.now().toString();
  }
  const parsedTimestamp = Date.parse(generationTimestamp);
  if (Number.isNaN(parsedTimestamp)) {
    return Date.now().toString();
  }
  return parsedTimestamp.toString();
}

export async function generateBomLogic(
  prompt: string | null,
  image: File | null,
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
  if (prompt) {
    contents.push({ text: prompt });
  }

  // 2. Call Gemini for Nodal Computation & Extraction
  const extraction = await runWithModelFallback(
    ai,
    contents,
    {
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
    (text) => JSON.parse(text || "{}") as {
      items: ItemModel[];
      alerts: BomAlert[];
      tag: ProjectTagEnum;
    },
  );

  const extractedItems = extraction.items || [];

  // 3. Pricing Engine & Inventory Creation Logic
  const itemsWithPricing = await Promise.all(
    extractedItems.map(
      async (item: ItemModel, index: number): Promise<GeneratedBOMItem> => {
        // Run real web search / scraping
        const storeOptions = await resolveComponentPricing(
          item.name,
          item.partNumber,
        );

        // Find the cheapest to set as default
        const cheapestOption =
          storeOptions.find((s) => s.isCheapest) || storeOptions[0];

        // Add randomness to out-of-stock status
        // 30% chance of being out of stock, 70% chance of being in stock
        const randomOutOfStock = Math.random() < 0.3;

        // Determine stock status with randomness
        const baseInStock = cheapestOption?.inStock ?? true;
        const isInStock = randomOutOfStock ? false : baseInStock;

        // Vary stockCount for in-stock items (50-200) instead of always 100
        const stockCount = isInStock
          ? Math.floor(Math.random() * 150) + 50 // Random between 50-200
          : 0;

        const stock = isInStock ? StockStatus.IN_STOCK : StockStatus.OUT;
        const generatedItemId = `c-gen-${slugify(item.name)}-${generationSuffix}-${index}`;

        // Simulate inventory creation
        try {
          await createItem({
            id: generatedItemId,
            name: item.name,
            partNumber: item.partNumber,
            specs: item.specs,
            unitPrice: cheapestOption ? cheapestOption.price : 0,
            stock,
            stockCount,
            category: item.category,
            pins: item.pins || [],
            details: item.details,
          });
        } catch (err) {
          console.warn(`Could not sync item to inventory: ${item.name}`, err);
        }

        return {
          id: generatedItemId,
          name: item.name,
          partNumber: item.partNumber,
          specs: item.specs,
          unitPrice: cheapestOption ? cheapestOption.price : 0,
          stock,
          stockCount,
          category: item.category,
          pins: item.pins || [],
          details: item.details,
          storeOptions,
        };
      },
    ),
  );

  return {
    items: itemsWithPricing,
    alerts: extraction.alerts || [],
    tag: extraction.tag || ProjectTagEnum.NA,
  };
}
