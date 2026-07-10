import { NextResponse } from "next/server";
import { ProviderType } from "@/lib/ai/types";
import { ProviderConfigManager } from "@/lib/ai/providerConfig";

const ALL_PROVIDERS: ProviderType[] = [
  ProviderType.GEMINI,
  ProviderType.OPENAI,
  ProviderType.OPENROUTER,
  ProviderType.CHATGPT,
];

export async function GET() {
  const manager = new ProviderConfigManager();
  const available: Record<ProviderType, boolean> = {
    [ProviderType.GEMINI]: false,
    [ProviderType.OPENAI]: false,
    [ProviderType.OPENROUTER]: false,
    [ProviderType.CHATGPT]: false,
  };
  for (const provider of ALL_PROVIDERS) {
    available[provider] = manager.isProviderAvailable(provider);
  }
  return NextResponse.json({ available });
}
