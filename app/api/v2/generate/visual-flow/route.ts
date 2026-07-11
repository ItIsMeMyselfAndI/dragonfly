import { NextRequest, NextResponse } from "next/server";
import { generateVisualFlowLogic } from "@/lib/apis/generate/visualFlowServer";
import { ProviderType } from "@/lib/ai/types";
import { getServerUser } from "@/lib/supabase/server";
import { resolveProviderAccess } from "@/lib/settings/server";
import { generationErrorResponse } from "@/lib/apis/generate/serverError";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const bomComponentsContext = formData.get("bomComponentsContext") as string;
    const specsContext = formData.get("specsContext") as string;
    const prompt = formData.get("prompt") as string | null;
    const image = formData.get("image") as File | null;
    const projectId = formData.get("projectId") as string;
    const providerType = formData.get("providerType") as "gemini" | "openai" | "openrouter" | "chatgpt" | null;
    const model = formData.get("model") as string | null;

    if (!bomComponentsContext && !specsContext) {
      return NextResponse.json(
        { error: "Missing bomComponentsContext or specsContext" },
        { status: 400 },
      );
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

    const result = await generateVisualFlowLogic(
      bomComponentsContext,
      specsContext,
      prompt,
      image,
      projectId,
      resolvedProvider,
      model ?? undefined,
      access.userApiKey,
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("Visual Flow Generation Error:", error);
    return generationErrorResponse(error);
  }
}
