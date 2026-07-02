import { NextRequest, NextResponse } from "next/server";
import { generateVisualFlowLogic } from "@/lib/apis/generate/visualFlowServer";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const bomContext = formData.get("bomContext") as string;
    const prompt = formData.get("prompt") as string | null;
    const image = formData.get("image") as File | null;

    if (!bomContext) {
      return NextResponse.json(
        { error: "Missing bomContext" },
        { status: 400 },
      );
    }

    const result = await generateVisualFlowLogic(bomContext, prompt, image);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Visual Flow Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
