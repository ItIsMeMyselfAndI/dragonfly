import { ProjectTagEnum } from "../apis/project/types";

export interface GeneratedSpecs {
  specs: Array<{
    componentName: string;
    computedSpecs: string;
    reasoning: string;
    calculation: { formula: string; result: string };
  }>;
  summary: string;
}

export interface GeneratedBOM {
  items: any[];
  components: any[];
  substitutes: Array<{ originalComponentId: string; substituteComponentId: string }>;
  alerts: any[];
  tag: ProjectTagEnum;
}

export interface GeneratedFlow {
  name: string;
  tag: ProjectTagEnum;
  nodes: any[];
  edges: any[];
}

// Provider enums
export enum ProviderType {
  GEMINI = "gemini",
  OPENAI = "openai",
  OPENROUTER = "openrouter",
  CHATGPT = "chatgpt",
}

// Provider config
export interface ProviderConfig {
  type: ProviderType;
  apiKey: string;
  apiUrl?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

export interface APIResponse<T> {
  data: T;
  provider: ProviderType;
  model: string;
  tokensUsed: TokenUsage;
  cost: number;
  latency: number;
  cached: boolean;
}
