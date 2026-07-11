import { ProviderType } from "@/lib/ai/types";
import { ProviderConfigManager } from "@/lib/ai/providerConfig";
import { NextResponse } from "next/server";

const providerConfig = new ProviderConfigManager();

export async function GET() {
  try {
    const availableProviders = providerConfig.getAvailableProviders();
    const supportedProviders = {
      gemini: {
        name: "Gemini",
        available: providerConfig.isProviderAvailable(ProviderType.GEMINI),
        models: ["gemini-2.5-flash-lite", "gemini-2.0-flash"],
        description: "Google's multimodal AI model",
        tags: ["multimodal", "code", "analysis"],
      },
      openai: {
        name: "OpenAI",
        available: providerConfig.isProviderAvailable(ProviderType.OPENAI),
        models: ["gpt-4o", "gpt-4", "gpt-3.5-turbo"],
        description: "OpenAI's conversational AI",
        tags: ["chat", "completion", "text"],
      },
      openrouter: {
        name: "OpenRouter",
        available: providerConfig.isProviderAvailable(ProviderType.OPENROUTER),
        models: [
          "openai/gpt-4o",
          "openai/gpt-4",
          "anthropic/claude-3.5-sonnet",
          "google/gemini-2.0-flash",
        ],
        description: "Unified access to multiple AI models",
        tags: ["multi-model", "open-source"],
      },
      chatgpt: {
        name: "ChatGPT",
        available: providerConfig.isProviderAvailable(ProviderType.CHATGPT),
        models: ["gpt-4o", "gpt-4", "gpt-3.5-turbo"],
        description: "OpenAI's ChatGPT service",
        tags: ["chat", "conversational"],
      },
    };

    const status = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      providers: availableProviders.reduce(
        (acc, provider) => {
          acc[provider] = supportedProviders[provider];
          return acc;
        },
        {} as any,
      ),
      capabilities: {
        imageProcessing: true,
        multimodalInput: true,
        jsonOutput: true,
        streaming: true,
        schemaValidation: true,
      },
      generationLimits: {
        requestsPerMinute: {
          gemini: 100,
          openai: 100,
          openrouter: 60,
          chatgpt: 100,
        },
      },
    };

    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    console.error("Sync endpoint error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
