import { NextResponse } from "next/server";
import { runPipeline } from "@/lib/apis/generate/orchestrator";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const prompt = formData.get("prompt") as string | null;
    const image = formData.get("image") as File | null;

    if (!prompt && !image) {
      return NextResponse.json(
        { error: "Missing prompt or image" },
        { status: 400 },
      );
    }

    const result = await runPipeline(prompt, image);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Pipeline Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate project data" },
      { status: 500 },
    );
  }
}
