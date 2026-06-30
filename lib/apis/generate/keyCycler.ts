const API_KEYS = process.env.GEMINI_API_KEYS?.split(",") || [];
let currentKeyIndex = 0;

export function getNextApiKey(): string {
  if (API_KEYS.length === 0) {
    // Fallback to the single key if the list is empty
    return process.env.GEMINI_API_KEY || "";
  }

  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
}
