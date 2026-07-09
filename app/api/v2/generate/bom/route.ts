import { generateBomLogic } from "@/lib/apis/generate/bomServer";
import { ProviderType } from "@/lib/ai/types";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const specsContext = formData.get("specsContext") as string;
    const image = formData.get("image") as File | null;
    const projectId = formData.get("projectId") as string;
    const providerType = formData.get("providerType") as "gemini" | "openai" | "openrouter" | "chatgpt" | null;

    if (!specsContext) {
      return NextResponse.json(
        { error: "Missing specsContext" },
        { status: 400 },
      );
    }

    const result = await generateBomLogic(specsContext, image, projectId, undefined, (providerType as ProviderType) || ProviderType.GEMINI);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("BOM Gen Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate BOM" },
      { status: 500 },
    );
  }
}
