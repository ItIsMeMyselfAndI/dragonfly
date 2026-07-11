import { AIMessage, AIConfig, AIResponse, AIStreamResponse } from "../aiService";
import { GeneratedBOM, GeneratedSpecs, GeneratedFlow } from "../types";
import OpenAI from "openai";

export class OpenAIProvider {
  private openai: OpenAI;
  private apiKey: string;

  constructor(apiKey: string, baseURL?: string) {
    this.apiKey = apiKey;
    this.openai = new OpenAI({
      apiKey,
      baseURL: baseURL || undefined,
    });
  }

  getApiKey(): string {
    return this.apiKey;
  }

  async generate<T>(aiMessages: AIMessage[], config: AIConfig, parser: (text: string) => T): Promise<AIResponse<T>> {
    const messages = aiMessages.map((msg) => {
      const content: any = [];

      if (msg.inlineData) {
        content.push({
          type: "image_url",
          image_url: {
            url: `data:${msg.inlineData.mimeType};base64,${msg.inlineData.data}`,
          },
        });
      }

      if (msg.content) {
        content.push({
          type: "text",
          text: msg.content,
        });
      }

      return {
        role: msg.role,
        content:
          content.length === 1
            ? content[0]
            : content.length > 1
              ? content
              : "",
      };
    });

    const response = await this.openai.chat.completions.create({
      model: config.model || "gpt-4o",
      messages: [
        ...(config.systemInstruction ? [{ role: "system" as const, content: config.systemInstruction }] : []),
        ...messages as any,
      ],
      response_format: {
        type: config.responseMimeType === "application/json" ? "json_object" : "text",
      },
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    });

    const choice = response.choices[0];
    const text = choice?.message?.content || "";

    return {
      text,
      data: parser(text),
      provider: "openai",
      model: config.model || "gpt-4o",
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens || 0,
            completionTokens: response.usage.completion_tokens || 0,
            totalTokens: response.usage.total_tokens || 0,
          }
        : undefined,
      finishReason: (choice.finish_reason || "STOP") as any,
    };
  }

  async streamGenerate<T>(aiMessages: AIMessage[], config: AIConfig, parser: (text: string) => T): Promise<AIStreamResponse<T>> {
    const messages = aiMessages.map((msg) => {
      const content: any = [];

      if (msg.inlineData) {
        content.push({
          type: "image_url",
          image_url: {
            url: `data:${msg.inlineData.mimeType};base64,${msg.inlineData.data}`,
          },
        });
      }

      if (msg.content) {
        content.push({
          type: "text",
          text: msg.content,
        });
      }

      return {
        role: msg.role,
        content:
          content.length === 1
            ? content[0]
            : content.length > 1
              ? content
              : "",
      };
    });

    const stream = await this.openai.chat.completions.create({
      model: config.model || "gpt-4o",
      messages: [
        ...(config.systemInstruction ? [{ role: "system" as const, content: config.systemInstruction }] : []),
        ...messages as any,
      ],
      response_format: {
        type: config.responseMimeType === "application/json" ? "json_object" : "text",
      },
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      stream: true,
    });

    const streamResponse: AIStreamResponse<T> = {
      text: "",
      data: {} as T,
      provider: "openai",
      model: config.model || "gpt-4o",
      finishReason: "STOP",
      stream: (async function* () {
        for await (const chunk of stream) {
          const choice = chunk.choices[0];
          if (choice?.delta?.content) {
            yield {
              text: choice.delta.content,
              data: parser(choice.delta.content),
              provider: "openai",
              model: config.model || "gpt-4o",
              finishReason: (choice.finish_reason || "STOP") as "STOP" | "MAX_TOKENS" | "SAFETY" | "OTHER",
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