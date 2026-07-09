import { GeneratedBOM, GeneratedSpecs, GeneratedFlow, ProviderType } from "@/lib/ai/types";

export interface AIGenerateOptions {
  provider?: ProviderType;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIMultiProviderOptions {
  primaryProvider: ProviderType;
  fallbackProviders?: ProviderType[];
  maxRetries?: number;
  timeoutMs?: number;
  roundRobin?: boolean;
}

export class AIInterventionClient {
  private apiUrl: string;
  private defaultProvider: ProviderType;
  private fallbackProviders: ProviderType[];
  private currentProviderIndex = 0;

  constructor(
    apiUrl: string = "/api/v2/generate",
    options: AIMultiProviderOptions = {
      primaryProvider: ProviderType.GEMINI,
      fallbackProviders: [ProviderType.OPENAI, ProviderType.OPENROUTER, ProviderType.CHATGPT],
    }
  ) {
    this.apiUrl = apiUrl;
    this.defaultProvider = options.primaryProvider;
    this.fallbackProviders = options.fallbackProviders || [];
  }

  async generateBOM(
    specsContext: string | null,
    image: File | null,
    projectId: string,
    generationTimestamp?: string,
    options: AIGenerateOptions = {}
  ): Promise<GeneratedBOM> {
    const providerType = options.provider || this.defaultProvider;
    const response = await this.makeRequest("bom", "POST", {
      specsContext,
      image,
      projectId,
      generationTimestamp,
      providerType,
      ...options,
    });
    return response;
  }

  async generateSpecs(
    prompt: string | null,
    image: File | null,
    options: AIGenerateOptions = {}
  ): Promise<GeneratedSpecs> {
    const providerType = options.provider || this.defaultProvider;
    const response = await this.makeRequest("specs", "POST", {
      prompt,
      image,
      providerType,
      ...options,
    });
    return response;
  }

  async generateVisualFlow(
    bomComponentsContext: string,
    specsContext: string,
    prompt: string | null,
    image: File | null,
    projectId: string,
    options: AIGenerateOptions = {}
  ): Promise<GeneratedFlow> {
    const providerType = options.provider || this.defaultProvider;
    const response = await this.makeRequest("visual-flow", "POST", {
      bomComponentsContext,
      specsContext,
      prompt,
      image,
      projectId,
      providerType,
      ...options,
    });
    return response;
  }

  async getSystemStatus(): Promise<any> {
    const response = await this.makeRequest("sync", "GET");
    return response;
  }

  async generateWithFallback(
    operation: "bom" | "specs" | "visual-flow",
    params: any,
    options: AIMultiProviderOptions = {
      primaryProvider: ProviderType.GEMINI,
      fallbackProviders: [ProviderType.OPENAI, ProviderType.OPENROUTER, ProviderType.CHATGPT],
    }
  ): Promise<any> {
    const providers = [options.primaryProvider, ...(options.fallbackProviders ?? [])];
    let lastError: Error | null = null;

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      
      try {
        switch (operation) {
          case "bom":
            return await this.generateBOM(
              params.specsContext,
              params.image,
              params.projectId,
              params.generationTimestamp,
              { provider }
            );
          case "specs":
            return await this.generateSpecs(
              params.prompt,
              params.image,
              { provider }
            );
          case "visual-flow":
            return await this.generateVisualFlow(
              params.bomComponentsContext,
              params.specsContext,
              params.prompt,
              params.image,
              params.projectId,
              { provider }
            );
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        
        if (options.maxRetries && i < options.maxRetries - 1) {
          continue;
        }
        
        if (provider !== options.primaryProvider && options.fallbackProviders?.includes(provider)) {
          continue;
        }
        
        throw lastError;
      }
    }
    
    throw lastError || new Error("All providers failed");
  }

  private async makeRequest(
    endpoint: string,
    method: string,
    body?: any,
    provider?: ProviderType
  ): Promise<any> {
    const url = `${this.apiUrl}/${endpoint}`;
    const formData = new FormData();

    for (const [key, value] of Object.entries(body || {})) {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    }

    if (provider) {
      formData.append("providerType", provider);
    }

    const response = await fetch(url, {
      method,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  getNextProvider(): ProviderType {
    const allProviders: ProviderType[] = [ProviderType.GEMINI, ...this.fallbackProviders];
    const provider = allProviders[this.currentProviderIndex % allProviders.length];
    this.currentProviderIndex++;
    return provider;
  }

  resetProviderRoundRobin(): void {
    this.currentProviderIndex = 0;
  }
}

// Singleton instance for ease of use
export const aiClient = new AIInterventionClient();