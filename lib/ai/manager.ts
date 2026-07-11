import { AIInterventionClient } from "./client";
import { AIMetricCollector } from "./metrics";
import { APICache } from "./cache";
import { GeneratedBOM, GeneratedSpecs, GeneratedFlow, ProviderType, APIResponse } from "./types";

export class AIInterventionManager {
  private client: AIInterventionClient;
  private metricsCollector: AIMetricCollector;
  private cache: APICache;
  private providerPriority: ProviderType[];
  private enableCaching: boolean = true;
  private maxRetries: number = 3;

  constructor(
    client?: AIInterventionClient,
    metrics?: AIMetricCollector,
    cache?: APICache,
    options: {
      providerPriority?: ProviderType[];
      enableCaching?: boolean;
      maxRetries?: number;
    } = {}
  ) {
    this.client = client || new AIInterventionClient();
    this.metricsCollector = metrics || new AIMetricCollector();
    this.cache = cache || new APICache();
    this.providerPriority = options.providerPriority || [
      ProviderType.GEMINI,
      ProviderType.OPENAI,
      ProviderType.OPENROUTER,
      ProviderType.CHATGPT,
    ];
    this.enableCaching = options.enableCaching ?? true;
    this.maxRetries = options.maxRetries || 3;
  }

  async generateBOM(
    specsContext: string | null,
    image?: File,
    projectId?: string,
    generationTimestamp?: string,
    options?: {
      useCache?: boolean;
      preferProvider?: ProviderType;
    }
  ): Promise<APIResponse<GeneratedBOM>> {
    const cacheKey = this.buildCacheKey("bom", { specsContext, image, projectId });
    
    if (this.enableCaching && options?.useCache !== false) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        const response: APIResponse<GeneratedBOM> = {
          data: cached.data,
          provider: cached.provider,
          model: "gemini-2.5-flash-lite",
          tokensUsed: { prompt: 0, completion: 0, total: 0 },
          cost: 0,
          latency: 0,
          cached: true,
        };
        await this.metricsCollector.recordRequest(cached.provider, true, 0);
        return response;
      }
    }

    const startTime = Date.now();
    let lastError: Error | null = null;
    
    const providers = this.getProviderOrder(options?.preferProvider);

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      
      try {
        const result = await this.client.generateBOM(
          specsContext,
          image || null,
          projectId || "",
          generationTimestamp,
          { provider }
        );

        const latency = Date.now() - startTime;
        await this.metricsCollector.recordRequest(provider, true, latency);
        
        if (this.enableCaching && options?.useCache !== false) {
          this.cache.set(cacheKey, result, 300000, provider);
        }

        return {
          data: result,
          provider,
          model: provider === ProviderType.GEMINI ? "gemini-2.5-flash-lite" : "gpt-4o",
          tokensUsed: { prompt: 0, completion: 0, total: 0 },
          cost: 0,
          latency,
          cached: false,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        await this.metricsCollector.recordRequest(provider, false, Date.now() - startTime, undefined, lastError);
        
        if (i < providers.length - 1) {
          continue;
        }
      }
    }

    throw lastError || new Error("All providers failed");
  }

  async generateSpecs(
    prompt: string | null,
    image?: File,
    options?: {
      useCache?: boolean;
      preferProvider?: ProviderType;
    }
  ): Promise<APIResponse<GeneratedSpecs>> {
    const cacheKey = this.buildCacheKey("specs", { prompt, image });
    
    if (this.enableCaching && options?.useCache !== false) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        const response: APIResponse<GeneratedSpecs> = {
          data: cached.data,
          provider: cached.provider,
          model: "gemini-2.5-flash-lite",
          tokensUsed: { prompt: 0, completion: 0, total: 0 },
          cost: 0,
          latency: 0,
          cached: true,
        };
        await this.metricsCollector.recordRequest(cached.provider, true, 0);
        return response;
      }
    }

    const startTime = Date.now();
    let lastError: Error | null = null;
    
    const providers = this.getProviderOrder(options?.preferProvider);

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      
      try {
        const result = await this.client.generateSpecs(
          prompt,
          image || null,
          { provider }
        );

        const latency = Date.now() - startTime;
        await this.metricsCollector.recordRequest(provider, true, latency);
        
        if (this.enableCaching && options?.useCache !== false) {
          this.cache.set(cacheKey, result, 300000, provider);
        }

        return {
          data: result,
          provider,
          model: provider === ProviderType.GEMINI ? "gemini-2.5-flash-lite" : "gpt-4o",
          tokensUsed: { prompt: 0, completion: 0, total: 0 },
          cost: 0,
          latency,
          cached: false,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        await this.metricsCollector.recordRequest(provider, false, Date.now() - startTime, undefined, lastError);
        
        if (i < providers.length - 1) {
          continue;
        }
      }
    }

    throw lastError || new Error("All providers failed");
  }

  async generateVisualFlow(
    bomComponentsContext: string,
    specsContext: string,
    prompt: string | null,
    image?: File,
    projectId?: string,
    options?: {
      useCache?: boolean;
      preferProvider?: ProviderType;
    }
  ): Promise<APIResponse<GeneratedFlow>> {
    const cacheKey = this.buildCacheKey("visual-flow", {
      bomComponentsContext,
      specsContext,
      prompt,
      image,
      projectId,
    });
    
    if (this.enableCaching && options?.useCache !== false) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        const response: APIResponse<GeneratedFlow> = {
          data: cached.data,
          provider: cached.provider,
          model: "gemini-2.5-flash-lite",
          tokensUsed: { prompt: 0, completion: 0, total: 0 },
          cost: 0,
          latency: 0,
          cached: true,
        };
        await this.metricsCollector.recordRequest(cached.provider, true, 0);
        return response;
      }
    }

    const startTime = Date.now();
    let lastError: Error | null = null;
    
    const providers = this.getProviderOrder(options?.preferProvider);

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      
      try {
        const result = await this.client.generateVisualFlow(
          bomComponentsContext,
          specsContext,
          prompt,
          image || null,
          projectId || "",
          { provider }
        );

        const latency = Date.now() - startTime;
        await this.metricsCollector.recordRequest(provider, true, latency);
        
        if (this.enableCaching && options?.useCache !== false) {
          this.cache.set(cacheKey, result, 300000, provider);
        }

        return {
          data: result,
          provider,
          model: provider === ProviderType.GEMINI ? "gemini-2.5-flash-lite" : "gpt-4o",
          tokensUsed: { prompt: 0, completion: 0, total: 0 },
          cost: 0,
          latency,
          cached: false,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        await this.metricsCollector.recordRequest(provider, false, Date.now() - startTime, undefined, lastError);
        
        if (i < providers.length - 1) {
          continue;
        }
      }
    }

    throw lastError || new Error("All providers failed");
  }

  private getProviderOrder(preferProvider?: ProviderType): ProviderType[] {
    if (preferProvider && this.providerPriority.includes(preferProvider)) {
      const filtered = this.providerPriority.filter((p) => p !== preferProvider);
      return [preferProvider, ...filtered];
    }
    return this.providerPriority;
  }

  private buildCacheKey(operation: string, params: any): string {
    const keyData = JSON.stringify(
      Object.keys(params)
        .sort()
        .reduce((acc, key) => {
          if (params[key] !== null && params[key] !== undefined) {
            acc[key] = params[key];
          }
          return acc;
        }, {} as any)
    );
    return `${operation}:${keyData}`;
  }

  getMetrics() {
    return this.metricsCollector.getMetrics();
  }

  clearCache(): void {
    this.cache.clear();
  }

  updateProviderPriority(priority: ProviderType[]): void {
    this.providerPriority = priority;
  }

  setCachingEnabled(enable: boolean): void {
    this.enableCaching = enable;
  }

  setMaxRetries(max: number): void {
    this.maxRetries = max;
  }
}