import { GoogleGenAI } from "@google/genai";
import { AIMessage, AIConfig, AIResponse, AIStreamResponse } from "../aiService";

export class GeminiGenAIProvider {
  private ai: GoogleGenAI;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.ai = new GoogleGenAI({ apiKey });
  }

  getApiKey(): string {
    return this.apiKey;
  }

  async generate<T>(aiMessages: AIMessage[], config: AIConfig, parser: (text: string) => T): Promise<AIResponse<T>> {
    const contents = aiMessages.map((msg) => {
      const parts: any[] = [];

      if (msg.inlineData) {
        parts.push({
          inlineData: {
            data: msg.inlineData.data,
            mimeType: msg.inlineData.mimeType,
          },
        });
      }

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      return {
        role: msg.role,
        parts,
      };
    });

    const response = await this.ai.models.generateContent({
      model: config.model || "gemini-2.5-flash-lite",
      contents,
      config: {
        systemInstruction: config.systemInstruction,
        responseMimeType: config.responseMimeType,
        responseSchema: config.responseSchema,
        maxOutputTokens: config.maxTokens,
        temperature: config.temperature,
      },
    });

    return {
      text: response.text || "",
      data: parser(response.text || "{}"),
      provider: "gemini",
      model: config.model || "gemini-2.5-flash-lite",
      usage: response.usageMetadata
        ? {
            promptTokens: response.usageMetadata.promptTokenCount || 0,
            completionTokens: response.usageMetadata.candidatesTokenCount || 0,
            totalTokens: response.usageMetadata.totalTokenCount || 0,
          }
        : undefined,
      finishReason: (response.candidates?.[0]?.finishReason || "STOP") as "STOP" | "MAX_TOKENS" | "SAFETY" | "OTHER",
    };
  }

  async streamGenerate<T>(aiMessages: AIMessage[], config: AIConfig, parser: (text: string) => T): Promise<AIStreamResponse<T>> {
    const contents = aiMessages.map((msg) => {
      const parts: any[] = [];

      if (msg.inlineData) {
        parts.push({
          inlineData: {
            data: msg.inlineData.data,
            mimeType: msg.inlineData.mimeType,
          },
        });
      }

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      return {
        role: msg.role,
        parts,
      };
    });

    const stream = this.ai.models.generateContentStream({
      model: config.model || "gemini-2.5-flash-lite",
      contents,
      config: {
        systemInstruction: config.systemInstruction,
        responseMimeType: config.responseMimeType,
        responseSchema: config.responseSchema,
        maxOutputTokens: config.maxTokens,
        temperature: config.temperature,
      },
    });

    const streamResponse: AIStreamResponse<T> = {
      text: "",
      data: {} as T,
      provider: "gemini",
      model: config.model || "gemini-2.5-flash-lite",
      finishReason: "STOP",
      stream: (async function* () {
        const streamIterator = await stream;
        for await (const chunk of streamIterator) {
          if (chunk.text) {
            yield {
              text: chunk.text,
              data: parser(chunk.text),
              provider: "gemini",
              model: config.model || "gemini-2.5-flash-lite",
              finishReason: (chunk.candidates?.[0]?.finishReason || "STOP") as "STOP" | "MAX_TOKENS" | "SAFETY" | "OTHER",
            };
          }
        }
      })(),
    };

    return streamResponse;
  }

  validateResponse<T>(response: AIResponse<T>, schema?: any): boolean {
    if (!schema) return true;

    try {
      if (response.data) {
        const temp = response.data as any;
        return true;
      }
    } catch (error) {
      console.error("Response validation failed:", error);
      return false;
    }

    return true;
  }
}