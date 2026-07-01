import { NextRequest, NextResponse } from "next/server";
import { generateVisualFlowLogic } from "@/lib/apis/generate/visualFlowServer";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const specsContext = formData.get("specsContext") as string;
    const prompt = formData.get("prompt") as string | null;
    const image = formData.get("image") as File | null;

    if (!specsContext) {
      return NextResponse.json(
        { error: "Missing specsContext" },
        { status: 400 },
      );
    }

    const result = await generateVisualFlowLogic(specsContext, prompt, image);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Visual Flow Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
