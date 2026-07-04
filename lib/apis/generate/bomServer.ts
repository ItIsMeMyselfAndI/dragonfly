import { GoogleGenAI } from "@google/genai";
import { BomExtractionSchema } from "@/lib/apis/generate/bomSchema";
import { resolveComponentPricing } from "@/lib/pricing";
import {
  ItemDetails,
  ItemModel,
  StockStatus,
} from "@/lib/apis/inventory/types";
import { type BomAlert } from "@/features/bom/data";
import {
  ProjectComponentModel,
  ProjectTagEnum,
} from "@/lib/apis/project/types";
import { GeneratedBOM } from "./types";
import { getNextApiKey } from "./keyCycler";
import { normalizeGenerationTimestamp, runWithModelFallback } from "./utils";
// Helper for deterministic IDs
// function slugify(text: string) {
//   return text
//     .toString()
//     .toLowerCase()
//     .trim()
//     .replace(/\s+/g, "-")
//     .replace(/[^\w\-]+/g, "")
//     .replace(/\-\-+/g, "-");
// }

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
  const extraction = await runWithModelFallback(
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
      8. ID Consistency: Ensure the 'inventoryId' in components and the item.details matches the corresponding generated item ID.`,
      responseMimeType: "application/json",
      responseSchema: BomExtractionSchema,
    },
    (text) =>
      JSON.parse(text || "{}") as {
        items: ItemModel[];
        components: ProjectComponentModel[];
        alerts: BomAlert[];
        tag: ProjectTagEnum;
      },
  );

  const items = extraction.items || [];
  const components = extraction.components || [];
  const tag = extraction.tag || ProjectTagEnum.NA;
  const alerts = extraction.alerts || [];
  //
  // // 3. Pricing Engine & Inventory Creation Logic
  // const items = await Promise.all(
  //   extractedItems.map(async (item: any, index: number): Promise<ItemModel> => {
  //     const generatedItemId = `c-gen-${slugify(item.name)}-${generationSuffix}-${index}`;
  //     const storeOptions = await resolveComponentPricing(
  //       item.name,
  //       item.partNumber,
  //     );
  //
  //     const cheapestOption =
  //       storeOptions.find((s) => s.isCheapest) || storeOptions[0];
  //
  //     const randomOutOfStock = Math.random() < 0.3;
  //     const baseInStock = cheapestOption?.inStock ?? true;
  //     const isInStock = randomOutOfStock ? false : baseInStock;
  //
  //     const stockCount = isInStock ? Math.floor(Math.random() * 150) + 50 : 0;
  //
  //     const stock = isInStock ? StockStatus.IN_STOCK : StockStatus.OUT;
  //
  //     return {
  //       id: item.id,
  //       name: item.name,
  //       partNumber: item.partNumber,
  //       shortDesc: item.shortDesc,
  //       unitPrice: cheapestOption ? cheapestOption.price : 0,
  //       stock,
  //       stockCount,
  //       category: item.category,
  //       pins: item.pins || [],
  //       details: {
  //         ...item.details,
  //         inventoryId: generatedItemId, // Override with correct generated ID
  //       },
  //     };
  //   }),
  // );
  //
  // const components = extractedComponents.map((comp, idx) => {
  //   // Find matching item by index to align inventory ID
  //   const matchingItem = items[idx] || items[0];
  //   const itemDetails = matchingItem
  //     ? matchingItem.details
  //     : ({} as ItemDetails);
  //
  //   return {
  //     id: `comp-${idx}-${projectId}`,
  //     name: comp.name,
  //     inventoryId: comp.inventoryId, // Enforce correct mapping
  //     partNumber: comp.partNumber,
  //     unitPrice: matchingItem.unitPrice,
  //     qty: comp.qty || 1,
  //     stock: matchingItem.stock,
  //     stockCount: matchingItem.stockCount,
  //     category: comp.category,
  //     pins: comp.pins || [],
  //     shortDesc: comp.shortDesc,
  //     details: {
  //       ...comp.details,
  //       inventoryId: matchingItem.id, // Enforce correct mapping
  //     },
  //   };
  // });
  //
  return {
    items,
    components,
    alerts,
    tag,
  };
}
