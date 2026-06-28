import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { BomExtractionSchema } from "@/lib/schemas/bomSchema";
import { resolveComponentPricing } from "@/lib/pricing";
import { Component, StockStatus } from "@/lib/inventory/types";
import { type BomAlert } from "@/features/bom/data";
import { ProjectTagType } from "@/lib/project/types";

// Initialize Gen AI SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const prompt = formData.get("prompt") as string;
    const image = formData.get("image") as File;

    if (!prompt && !image) {
      return NextResponse.json(
        { error: "Missing prompt or image" },
        { status: 400 },
      );
    }

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
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: `You are an expert Electronics Engineer and System Architect. Your task is to analyze the provided electronic schematic image alongside the user's natural language description.

CRITICAL INSTRUCTIONS:
1. Nodal & Parametric Computation: Analyze the circuit layout and operating voltages. Calculate the required electrical ratings (Voltage, Current, Power dissipation P = V * I) for every discrete component.
2. Smart Component Selection: Select industrial, purchasable components that safely meet or exceed these ratings. If a standard component (e.g., BC547) cannot handle the calculated power dissipation, automatically upgrade it to a robust alternative (e.g., TIP120 or IRFZ44N) and note the reasoning in the specs.
3. Accuracy: Ensure exact part numbers are provided.
4. Alerts: If you detect a missing flyback diode for an inductive load or a voltage logic mismatch (e.g., 5V logic trying to trigger a 3.3V IC without a level shifter), add a compatibility alert.`,
        responseMimeType: "application/json",
        responseSchema: BomExtractionSchema,
      },
    });

    // Parse the structured JSON response
    const extraction = JSON.parse(response.text || "{}") as {
      items: Component[];
      alerts: BomAlert[];
      tag: ProjectTagType;
    };
    const extractedItems = extraction.items || [];

    // 3. Pricing Engine Logic
    const itemsWithPricing = await Promise.all(
      extractedItems.map(async (item: Component, index: number) => {
        // Run real web search / scraping
        const storeOptions = await resolveComponentPricing(
          item.name,
          item.partNumber,
        );

        // Find the cheapest to set as default
        const cheapestOption =
          storeOptions.find((s) => s.isCheapest) || storeOptions[0];

        return {
          ...item,
          id: `c-gen-${Date.now()}-${index}`,
          storeOptions,
          // Hydrate the default frontend expectations based on cheapest option
          unitPrice: cheapestOption ? cheapestOption.price : 0,
          stock: cheapestOption?.inStock
            ? StockStatus.IN_STOCK
            : StockStatus.OUT,
        };
      }),
    );

    // 4. Return the unified multi-store payload
    return NextResponse.json({
      items: itemsWithPricing,
      alerts: extraction.alerts || [],
      tag: extraction.tag || "N/A",
    });
  } catch (error) {
    console.error("BOM Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate BOM" },
      { status: 500 },
    );
  }
}
