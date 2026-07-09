import { NextResponse } from "next/server";
import { generateSpecsLogic } from "@/lib/apis/generate/specsServer";
import { ProviderType } from "@/lib/ai/types";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const prompt = formData.get("prompt") as string | null;
    const image = formData.get("image") as File | null;
    const providerType = formData.get("providerType") as "gemini" | "openai" | "openrouter" | "chatgpt" | null;

    if (!prompt && !image) {
      return NextResponse.json({ error: "Missing input" }, { status: 400 });
    }

    const result = await generateSpecsLogic(prompt, image, (providerType as ProviderType) || ProviderType.GEMINI);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Specs Gen Error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
