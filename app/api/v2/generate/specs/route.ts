import { NextResponse } from "next/server";
import { generateSpecsLogic } from "@/lib/apis/generate/specsServer";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const prompt = formData.get("prompt") as string | null;
    const image = formData.get("image") as File | null;

    if (!prompt && !image) {
      return NextResponse.json({ error: "Missing input" }, { status: 400 });
    }

    const result = await generateSpecsLogic(prompt, image);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Specs Gen Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
