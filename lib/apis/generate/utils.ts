export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 2000
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
