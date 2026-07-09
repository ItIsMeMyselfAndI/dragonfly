import { AIMessage, AIConfig } from "@/lib/ai/aiService";
import { ProviderType } from "@/lib/ai/types";
import { ProviderConfigManager } from "@/lib/ai/providerConfig";
import { ImageProcessor } from "@/lib/ai/imageProcessor";
import { GeminiGenAIProvider } from "@/lib/ai/providers/geminiGenAIProvider";
import { OpenAIProvider } from "@/lib/ai/providers/openaiProvider";
import { OpenRouterProvider } from "@/lib/ai/providers/openrouterProvider";
import { ChatGPTProvider } from "@/lib/ai/providers/chatgptProvider";
import { BomExtractionSchema } from "@/lib/apis/generate/bomSchema";
import { GeneratedBOM } from "./types";
import { normalizeGenerationTimestamp } from "./utils";

const providerConfig = new ProviderConfigManager();

function createProvider(providerType: ProviderType, apiKey: string) {
  switch (providerType) {
    case ProviderType.GEMINI:
      return new GeminiGenAIProvider(apiKey);
    case ProviderType.OPENAI:
      return new OpenAIProvider(apiKey);
    case ProviderType.OPENROUTER:
      return new OpenRouterProvider(apiKey);
    case ProviderType.CHATGPT:
      return new ChatGPTProvider(apiKey);
    default:
      return new GeminiGenAIProvider(apiKey);
  }
}

export async function generateBomLogic(
  specsContext: string | null,
  image: File | null,
  projectId: string,
  generationTimestamp?: string,
  providerType: ProviderType = ProviderType.GEMINI,
): Promise<GeneratedBOM> {
  const generationSuffix = normalizeGenerationTimestamp(generationTimestamp);

  const contents: AIMessage[] = [];
  if (image) {
    const { data, mimeType } = await ImageProcessor.toBase64(image);
    contents.push({
      role: "user",
      content: "",
      inlineData: { data, mimeType },
    });
  }
  if (specsContext) {
    contents.push({
      role: "user",
      content: `RELEVANT SPECS ANALYSIS {
      ${specsContext}
      }`,
    });
  }

  const apiKey = providerConfig.getNextKey(providerType);
  const provider = createProvider(providerType, apiKey);

  const config: AIConfig = {
    model: "gemini-2.5-flash-lite",
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
      9. Pricing (PHP - CRITICAL): Every 'unitPrice' value MUST be denominated in PHILIPPINE PESO (₱ / PHP) reflecting a REALISTIC local retail price in the Philippines. It must NOT be in USD or any other currency. Calibrate using these typical Philippine retail reference ranges: passive parts (resistor/capacitor) ~₱0.50-₱5; small-signal diode ~₱1-₱8; generic NPN/PNP transistor ~₱5-₱25; voltage regulator / small IC ~₱15-₱90; small MCU or dev module ~₱150-₱450; relay module ~₱40-₱180; small sensor module ~₱80-₱350; DC power supply / wall adapter ~₱200-₱700; speaker / buzzer ~₱30-₱200. Provide numerical float values only (e.g., 250.0 means about ₱250). A full DC power supply should NEVER be below ₱150.
      10. Stock Simulation (CRITICAL): Intelligently assign 'stock' status based on real-world electronics market trends (e.g., highly sought-after microcontrollers, niche sensors, or chips affected by shortages are more likely to be out of stock, whereas basic resistors are usually in stock). YOU MUST SET AT LEAST ONE ITEM TO OUT OF STOCK.
      11. Entity Consistency: The 'unitPrice', 'stock' status, and 'stockCount' (which must be 0 if out of stock) MUST perfectly match between the 'items' array and the 'components' array for the corresponding inventoryId.
      12. Substitutes (CRITICAL): For components that have viable, real-world alternative parts (e.g., a pin-compatible MCU, a drop-in sensor, a same-value passive from another manufacturer), generate TWO TO THREE alternatives as ADDITIONAL entries in the 'items' array. Each alternative MUST use a UNIQUE id following the pattern item-sub-{originalIndex}-{altIndex}-${generationSuffix} (e.g., item-sub-0-1-${generationSuffix}, item-sub-0-2-${generationSuffix}), with full 'details' populated. DO NOT add the alternatives to the 'components' array - they are alternative inventory parts, not separate BOM components.
      13. Substitute Mapping: For EVERY alternative you generate, add a pairing to the 'substitutes' array as { originalComponentId: <the original comp-{originalIndex}-${projectId} id>, substituteComponentId: <the item-sub-{originalIndex}-{altIndex}-${generationSuffix} id> }. The SAME originalComponentId will appear in multiple pairings (one per alternative). Every 'substituteComponentId' MUST correspond to an item present in the 'items' array, and every 'originalComponentId' MUST correspond to a component present in the 'components' array.
      14. Not all components need substitutes - only generate them where a sensible, compatible alternative genuinely exists, but when you do, aim for 2-3 options per component so the user can choose.`,
    responseMimeType: "application/json",
    responseSchema: BomExtractionSchema,
  };

  const response = await provider.generate(
    contents,
    config,
    (text) => JSON.parse(text || "{}") as GeneratedBOM,
  );

  return response.data;
}
