import { GeneratedBOM, GeneratedSpecs, GeneratedFlow, ProviderType } from "./types";

export interface AITokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

export interface AIProviderStatus {
  provider: ProviderType;
  available: boolean;
  models: string[];
  rateLimit: {
    requests: number;
    windowMs: number;
  };
  lastUsed: Date;
  failureCount: number;
}

export interface AISystemMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatencyMs: number;
  totalTokensUsed: number;
  totalCost: number;
  providerStats: Record<ProviderType, AIProviderStatus>;
}

export class AIMetricCollector {
  private metrics: AISystemMetrics;

  constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatencyMs: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      providerStats: {
        [ProviderType.GEMINI]: {
          provider: ProviderType.GEMINI,
          available: false,
          models: ["gemini-2.5-flash-lite", "gemini-2.0-flash"],
          rateLimit: { requests: 100, windowMs: 60000 },
          lastUsed: new Date(),
          failureCount: 0,
        },
        [ProviderType.OPENAI]: {
          provider: ProviderType.OPENAI,
          available: false,
          models: ["gpt-4o", "gpt-4", "gpt-3.5-turbo"],
          rateLimit: { requests: 100, windowMs: 60000 },
          lastUsed: new Date(),
          failureCount: 0,
        },
        [ProviderType.OPENROUTER]: {
          provider: ProviderType.OPENROUTER,
          available: false,
          models: [
            "openai/gpt-4o",
            "openai/gpt-4",
            "anthropic/claude-3.5-sonnet",
            "google/gemini-2.0-flash",
          ],
          rateLimit: { requests: 60, windowMs: 60000 },
          lastUsed: new Date(),
          failureCount: 0,
        },
        [ProviderType.CHATGPT]: {
          provider: ProviderType.CHATGPT,
          available: false,
          models: ["gpt-4o", "gpt-4", "gpt-3.5-turbo"],
          rateLimit: { requests: 100, windowMs: 60000 },
          lastUsed: new Date(),
          failureCount: 0,
        },
      },
    };
  }

  async recordRequest(
    provider: ProviderType,
    success: boolean,
    latencyMs: number,
    tokens?: AITokenUsage,
    error?: Error
  ): Promise<void> {
    this.metrics.totalRequests++;

    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
      this.metrics.providerStats[provider].failureCount++;

      if (error) {
        console.error(`AI Provider ${provider} failed:`, error.message);
      }
    }

    if (tokens) {
      this.metrics.totalTokensUsed += tokens.totalTokens;
      this.metrics.totalCost += tokens.cost;
    }

    this.metrics.averageLatencyMs =
      (this.metrics.averageLatencyMs * (this.metrics.totalRequests - 1) + latencyMs) /
      this.metrics.totalRequests;

    this.metrics.providerStats[provider].lastUsed = new Date();
  }

  getMetrics(): Readonly<AISystemMetrics> {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatencyMs: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      providerStats: {
        [ProviderType.GEMINI]: {
          provider: ProviderType.GEMINI,
          available: false,
          models: ["gemini-2.5-flash-lite", "gemini-2.0-flash"],
          rateLimit: { requests: 100, windowMs: 60000 },
          lastUsed: new Date(),
          failureCount: 0,
        },
        [ProviderType.OPENAI]: {
          provider: ProviderType.OPENAI,
          available: false,
          models: ["gpt-4o", "gpt-4", "gpt-3.5-turbo"],
          rateLimit: { requests: 100, windowMs: 60000 },
          lastUsed: new Date(),
          failureCount: 0,
        },
        [ProviderType.OPENROUTER]: {
          provider: ProviderType.OPENROUTER,
          available: false,
          models: [
            "openai/gpt-4o",
            "openai/gpt-4",
            "anthropic/claude-3.5-sonnet",
            "google/gemini-2.0-flash",
          ],
          rateLimit: { requests: 60, windowMs: 60000 },
          lastUsed: new Date(),
          failureCount: 0,
        },
        [ProviderType.CHATGPT]: {
          provider: ProviderType.CHATGPT,
          available: false,
          models: ["gpt-4o", "gpt-4", "gpt-3.5-turbo"],
          rateLimit: { requests: 100, windowMs: 60000 },
          lastUsed: new Date(),
          failureCount: 0,
        },
      },
    };
  }
}