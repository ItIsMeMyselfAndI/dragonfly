import { AIModel } from "./aiService";
import { ProviderType } from "./types";

class ProviderConfigManager {
  private geminiKeys: string[] = [];
  private openaiKeys: string[] = [];
  private openrouterKeys: string[] = [];
  private chatgptKeys: string[] = [];

  private geminiIndex = 0;
  private openaiIndex = 0;
  private openrouterIndex = 0;
  private chatgptIndex = 0;

  constructor() {
    this.loadKeys();
  }

  private loadKeys(): void {
    this.geminiKeys = process.env.GEMINI_API_KEYS?.split(",") || [];
    this.openaiKeys = process.env.OPENAI_API_KEYS?.split(",") || [];
    this.openrouterKeys = process.env.OPENROUTER_API_KEYS?.split(",") || [];
    this.chatgptKeys = process.env.CHATGPT_API_KEYS?.split(",") || [];
  }

  getNextKey(provider: ProviderType): string {
    switch (provider) {
      case ProviderType.GEMINI:
        return this.geminiKeys[this.geminiIndex++ % this.geminiKeys.length] || "";
      case ProviderType.OPENAI:
        return this.openaiKeys[this.openaiIndex++ % this.openaiKeys.length] || "";
      case ProviderType.OPENROUTER:
        return this.openrouterKeys[this.openrouterIndex++ % this.openrouterKeys.length] || "";
      case ProviderType.CHATGPT:
        return this.chatgptKeys[this.chatgptIndex++ % this.chatgptKeys.length] || "";
      default:
        return "";
    }
  }

  getModels(provider: ProviderType): AIModel[] {
    const baseKey = this.getNextKey(provider);

    const defaultModels = {
      [ProviderType.GEMINI]: ["gemini-2.5-flash-lite", "gemini-2.0-flash"],
      [ProviderType.OPENAI]: ["gpt-4o", "gpt-4", "gpt-3.5-turbo"],
      [ProviderType.OPENROUTER]: [
        "openai/gpt-4o",
        "openai/gpt-4",
        "anthropic/claude-3.5-sonnet",
        "google/gemini-2.0-flash",
      ],
      [ProviderType.CHATGPT]: ["gpt-4o", "gpt-4", "gpt-3.5-turbo"],
    };

    return defaultModels[provider].map((modelName) => ({
      name: modelName,
      provider: provider,
      apiKey: baseKey,
    }));
  }

  isProviderAvailable(provider: ProviderType): boolean {
    const keys = {
      [ProviderType.GEMINI]: this.geminiKeys,
      [ProviderType.OPENAI]: this.openaiKeys,
      [ProviderType.OPENROUTER]: this.openrouterKeys,
      [ProviderType.CHATGPT]: this.chatgptKeys,
    };

    return keys[provider]?.length > 0;
  }

  getAvailableProviders(): ProviderType[] {
    return Object.values(ProviderType).filter((provider) => this.isProviderAvailable(provider));
  }
}

export { ProviderConfigManager };