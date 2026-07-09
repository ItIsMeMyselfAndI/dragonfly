import { NextRequest, NextResponse } from "next/server";
import { generateVisualFlowLogic } from "@/lib/apis/generate/visualFlowServer";
import { ProviderType } from "@/lib/ai/types";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const bomComponentsContext = formData.get("bomComponentsContext") as string;
    const specsContext = formData.get("specsContext") as string;
    const prompt = formData.get("prompt") as string | null;
    const image = formData.get("image") as File | null;
    const projectId = formData.get("projectId") as string;
    const providerType = formData.get("providerType") as "gemini" | "openai" | "openrouter" | "chatgpt" | null;

    if (!bomComponentsContext && !specsContext) {
      return NextResponse.json(
        { error: "Missing bomComponentsContext or specsContext" },
        { status: 400 },
      );
    }

    const result = await generateVisualFlowLogic(
      bomComponentsContext,
      specsContext,
      prompt,
      image,
      projectId,
      (providerType as ProviderType) || ProviderType.GEMINI,
    );
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Visual Flow Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
