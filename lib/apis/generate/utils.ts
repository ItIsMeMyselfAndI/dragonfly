import { GoogleGenAI, GenerateContentConfig, GenerateContentResponse } from "@google/genai";

export const DEFAULT_MAX_RETRIES = 5;
export const DEFAULT_BASE_DELAY_MS = 2000;

function isRetriable(error: any): boolean {
  // If no error status is available, default to retrying as it might be a network/generic issue
  const status = error?.status || error?.code;
  if (!status) return true;

  // 429: Too Many Requests
  // 500-599: Server Errors
  return status === 429 || (status >= 500 && status <= 599);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = DEFAULT_MAX_RETRIES,
  baseDelayMs = DEFAULT_BASE_DELAY_MS,
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === retries - 1 || !isRetriable(error)) throw error;

      // Exponential backoff: 2^i * baseDelay
      // Jitter: add random value up to baseDelay
      const delay = Math.pow(2, i) * baseDelayMs + Math.random() * baseDelayMs;

      console.warn(`Attempt ${i + 1} failed (retriable), retrying in ${delay.toFixed(0)}ms...`, error);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
}

export async function runWithModelFallback<T>(
  ai: GoogleGenAI,
  contents: any[],
  config: GenerateContentConfig,
  parser: (text: string) => T,
): Promise<T> {
  const models = ["gemini-2.5-flash-lite", "gemini-2.0-flash"];

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });

      return parser(response.text || "{}");
    } catch (error: any) {
      console.warn(`Model ${model} failed:`, error.message);
      if (model === models[models.length - 1]) throw error;
    }
  }

  throw new Error("All model attempts failed");
}
