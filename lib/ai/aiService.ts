import { GeneratedBOM, GeneratedSpecs, GeneratedFlow } from "@/lib/ai/types";

export interface AIModel {
  name: string;
  provider: string;
  apiKey: string;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

export interface AIResponse<T> {
  text: string;
  data: T;
  provider: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: "STOP" | "MAX_TOKENS" | "SAFETY" | "OTHER";
}

export interface AIStreamResponse<T> extends AIResponse<T> {
  stream: AsyncIterable<AIResponse<T>>;
}

export interface AIMessage {
  role: "user" | "system" | "assistant";
  content: string;
  inlineData?: {
    data: string;
    mimeType: string;
  };
}

export interface AIConfig {
  model: string;
  maxTokens?: number;
  temperature?: number;
  systemInstruction?: string;
  responseMimeType?: string;
  responseSchema?: any;
  timeout?: number;
}

export interface AIService {
  generate<T>(
    contents: AIMessage[],
    config?: AIConfig,
    parser?: (text: string) => T,
  ): Promise<AIResponse<T>>;

  streamGenerate<T>(
    contents: AIMessage[],
    config?: AIConfig,
    parser?: (text: string) => T,
  ): Promise<AIStreamResponse<T>>;

  validateResponse<T>(response: AIResponse<T>, schema?: any): boolean;
}