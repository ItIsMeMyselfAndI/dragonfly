import { AIInterventionClient } from "@/lib/ai/client";
import { AIInterventionManager } from "@/lib/ai/manager";
import { AIMetricCollector } from "@/lib/ai/metrics";
import { APICache } from "@/lib/ai/cache";
import { GeneratedBOM, GeneratedSpecs, GeneratedFlow, ProviderType } from "@/lib/ai/types";

export class AIProviderUtils {
  static createClient(
    apiUrl?: string,
    options?: {
      primaryProvider?: ProviderType;
      fallbackProviders?: ProviderType[];
    }
  ): AIInterventionClient {
    return new AIInterventionClient(apiUrl, {
      primaryProvider: options?.primaryProvider || ProviderType.GEMINI,
      fallbackProviders: options?.fallbackProviders || [ProviderType.OPENAI, ProviderType.OPENROUTER, ProviderType.CHATGPT],
    });
  }

  static createManager(
    options?: {
      providerPriority?: ProviderType[];
      enableCaching?: boolean;
      maxRetries?: number;
    }
  ): AIInterventionManager {
    return new AIInterventionManager(undefined, undefined, undefined, options);
  }

  static createCompleteSetup(options?: {
    providerPriority?: ProviderType[];
    enableCaching?: boolean;
    maxRetries?: number;
  }): {
    client: AIInterventionClient;
    manager: AIInterventionManager;
    metrics: AIMetricCollector;
    cache: APICache;
  } {
    const metrics = new AIMetricCollector();
    const cache = new APICache();
    const client = AIProviderUtils.createClient(undefined, {
      primaryProvider: options?.providerPriority?.[0] || ProviderType.GEMINI,
      fallbackProviders: options?.providerPriority?.slice(1) || [ProviderType.OPENAI, ProviderType.OPENROUTER, ProviderType.CHATGPT],
    });
    const manager = new AIInterventionManager(client, metrics, cache, options);

    return { client, manager, metrics, cache };
  }

  static createDemoSetup(): {
    client: AIInterventionClient;
    manager: AIInterventionManager;
    metrics: AIMetricCollector;
    cache: APICache;
  } {
    console.log("🚀 Initializing AI provider setup...");
    console.log("📊 Available providers: Gemini, OpenAI, OpenRouter, ChatGPT");
    console.log("⚙️  Provider priority: Gemini → OpenAI → OpenRouter → ChatGPT");
    console.log("💾 Caching enabled for all providers");
    console.log("🔄 Max retries: 3");

    const { client, manager, metrics, cache } = AIProviderUtils.createCompleteSetup({
      providerPriority: [ProviderType.GEMINI, ProviderType.OPENAI, ProviderType.OPENROUTER, ProviderType.CHATGPT],
      enableCaching: true,
      maxRetries: 3,
    });

    console.log("✅ AI provider system initialized successfully!");
    console.log("   - Client ready for operations");
    console.log("   - Manager with fallback logic ready");
    console.log("   - Metrics collector tracking all operations");
    console.log("   - Cache ready for optimized performance");

    return { client, manager, metrics, cache };
  }
}