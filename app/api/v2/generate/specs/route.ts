import { NextResponse } from "next/server";
import { generateSpecsLogic } from "@/lib/apis/generate/specsServer";
import { ProviderType } from "@/lib/ai/types";
import { getServerUser } from "@/lib/supabase/server";
import { resolveProviderAccess } from "@/lib/settings/server";
import { generationErrorResponse } from "@/lib/apis/generate/serverError";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const prompt = formData.get("prompt") as string | null;
    const image = formData.get("image") as File | null;
    const providerType = formData.get("providerType") as "gemini" | "openai" | "openrouter" | "chatgpt" | null;
    const model = formData.get("model") as string | null;

    if (!prompt && !image) {
      return NextResponse.json({ error: "Missing input" }, { status: 400 });
    }

    const resolvedProvider =
      (providerType as ProviderType) || ProviderType.GEMINI;
    const user = await getServerUser();
    const access = await resolveProviderAccess(user, resolvedProvider);
    if (!access.available) {
      return NextResponse.json(
        { error: "PROVIDER_UNAVAILABLE", provider: resolvedProvider },
        { status: 400 },
      );
    }

    const result = await generateSpecsLogic(
      prompt,
      image,
      resolvedProvider,
      model ?? undefined,
      access.userApiKey,
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("Specs Gen Error:", error);
    return generationErrorResponse(error);
  }
}
