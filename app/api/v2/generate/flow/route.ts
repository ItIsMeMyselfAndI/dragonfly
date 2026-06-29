import { NextRequest, NextResponse } from "next/server";
import { generateFlowLogic } from "../../../../../lib/apis/generate/flowServer";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const specs = JSON.parse(formData.get("specs") as string);
    const prompt = formData.get("prompt") as string | null;
    const image = formData.get("image") as File | null;

    const flowData = await generateFlowLogic(specs, prompt, image);

    return NextResponse.json(flowData);
  } catch (error: any) {
    console.error("Flow generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
