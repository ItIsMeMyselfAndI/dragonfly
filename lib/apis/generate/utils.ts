export const DEFAULT_MAX_RETRIES = 5;
export const DEFAULT_DELAY_MS = 2000;

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = DEFAULT_MAX_RETRIES,
  delayMs = DEFAULT_DELAY_MS,
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      console.warn(`Attempt ${i + 1} failed, retrying...`, error);
    }
  }
  throw new Error("Max retries exceeded");
}
