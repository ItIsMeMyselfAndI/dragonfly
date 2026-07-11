import { GoogleGenAI, GenerateContentConfig } from "@google/genai";
import { AIMessage } from "@/lib/ai/aiService";

export const DEFAULT_MAX_RETRIES = 10;
export const DEFAULT_BASE_DELAY_MS = 2000;

function isRetriable(error: unknown): boolean {
  const e = error as { status?: number; httpStatus?: number };
  const status = e?.httpStatus ?? e?.status;
  // No status available (network/generic failure) -> retry, it might be transient.
  if (status === undefined || status === null) return true;

  // 429: Too Many Requests
  // 500-599: Server Errors
  return status === 429 || (status >= 500 && status <= 599);
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Generation cancelled"));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error("Generation cancelled"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = DEFAULT_MAX_RETRIES,
  baseDelayMs = DEFAULT_BASE_DELAY_MS,
  signal?: AbortSignal,
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    if (signal?.aborted) throw new Error("Generation cancelled");
    try {
      return await fn();
    } catch (error) {
      if (signal?.aborted) throw new Error("Generation cancelled");
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Generation cancelled");
      }
      if (i === retries - 1 || !isRetriable(error)) throw error;

      // Exponential backoff: 2^i * baseDelay
      // Jitter: add random value up to baseDelay
      const delay = Math.pow(2, i) * baseDelayMs + Math.random() * baseDelayMs;

      console.warn(
        `Attempt ${i + 1} failed (retriable), retrying in ${delay.toFixed(0)}ms...`,
        error,
      );
      try {
        await sleep(delay, signal);
      } catch {
        throw new Error("Generation cancelled");
      }
    }
  }
  throw new Error("Max retries exceeded");
}

export async function runWithModelFallback<T>(
  ai: GoogleGenAI,
  contents: AIMessage[],
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
    } catch (error) {
      console.warn(`Model ${model} failed:`, error);
      if (model === models[models.length - 1]) throw error;
    }
  }

  throw new Error("All model attempts failed");
}

export function normalizeGenerationTimestamp(
  generationTimestamp?: string,
): string {
  if (!generationTimestamp) {
    return Date.now().toString();
  }
  const parsedTimestamp = Date.parse(generationTimestamp);
  if (Number.isNaN(parsedTimestamp)) {
    return Date.now().toString();
  }
  return parsedTimestamp.toString();
}
