import { AIMessage, AIConfig } from "@/lib/ai/aiService";
import { ProviderType } from "@/lib/ai/types";
import { ProviderConfigManager } from "@/lib/ai/providerConfig";
import { ImageProcessor } from "@/lib/ai/imageProcessor";
import { GeminiGenAIProvider } from "@/lib/ai/providers/geminiGenAIProvider";
import { OpenAIProvider } from "@/lib/ai/providers/openaiProvider";
import { OpenRouterProvider } from "@/lib/ai/providers/openrouterProvider";
import { ChatGPTProvider } from "@/lib/ai/providers/chatgptProvider";
import { SpecsExtractionSchema } from "./specsSchema";
import { GeneratedSpecs } from "./types";

const providerConfig = new ProviderConfigManager();

function createProvider(providerType: ProviderType, apiKey: string) {
  switch (providerType) {
    case ProviderType.GEMINI:
      return new GeminiGenAIProvider(apiKey);
    case ProviderType.OPENAI:
      return new OpenAIProvider(apiKey);
    case ProviderType.OPENROUTER:
      return new OpenRouterProvider(apiKey);
    case ProviderType.CHATGPT:
      return new ChatGPTProvider(apiKey);
    default:
      return new GeminiGenAIProvider(apiKey);
  }
}

export async function generateSpecsLogic(
  prompt: string | null,
  image: File | null,
  providerType: ProviderType = ProviderType.GEMINI,
  model?: string,
  userApiKey?: string,
): Promise<GeneratedSpecs> {
  const contents: AIMessage[] = [];
  if (image) {
    const { data, mimeType } = await ImageProcessor.toBase64(image);
    contents.push({
      role: "user",
      content: "",
      inlineData: { data, mimeType },
    });
  }
  if (prompt) {
    contents.push({
      role: "user",
      content: prompt,
    });
  }

  const apiKey =
    userApiKey && userApiKey.trim()
      ? userApiKey
      : providerConfig.getNextKey(providerType);
  const provider = createProvider(providerType, apiKey);

  const config: AIConfig = {
    model: model ?? "gemini-2.5-flash-lite",
    systemInstruction: `
      You are an expert Electronics Engineer. Analyze the schematic/description.
      For every component, perform the calculation.
      CRITICAL: ONLY USE ASCII CHARACTERS. Do not use special symbols like Greek letters, mathematical symbols (e.g., Ω, η), or non-ASCII characters. Replace them with their ASCII equivalent (e.g., replace 'Ω' with 'Ohm', 'η' with 'eta').
      `,
    responseMimeType: "application/json",
    responseSchema: SpecsExtractionSchema,
  };

  const response = await provider.generate(
    contents,
    config,
    (text) => JSON.parse(text || "{}") as GeneratedSpecs,
  );

  return response.data;
}
