const API_KEYS = process.env.GEMINI_API_KEYS?.split(",") || [];
const OPENAI_API_KEYS = process.env.OPENAI_API_KEYS?.split(",") || [];
const OPENROUTER_API_KEYS = process.env.OPENROUTER_API_KEYS?.split(",") || [];
const CHATGPT_API_KEYS = process.env.CHATGPT_API_KEYS?.split(",") || [];
let currentKeyIndex = 0;
let openaiKeyIndex = 0;
let openrouterKeyIndex = 0;
let chatgptKeyIndex = 0;

export function getNextGeminiApiKey(): string {
  if (API_KEYS.length === 0) {
    // Fallback to the single key if the list is empty
    return process.env.GEMINI_API_KEY || "";
  }

  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
}

export function getNextOpenAIApiKey(): string {
  if (OPENAI_API_KEYS.length === 0) {
    return process.env.OPENAI_API_KEY || "";
  }

  const key = OPENAI_API_KEYS[openaiKeyIndex];
  openaiKeyIndex = (openaiKeyIndex + 1) % OPENAI_API_KEYS.length;
  return key;
}

export function getNextOpenRouterApiKey(): string {
  if (OPENROUTER_API_KEYS.length === 0) {
    return process.env.OPENROUTER_API_KEY || "";
  }

  const key = OPENROUTER_API_KEYS[openrouterKeyIndex];
  openrouterKeyIndex = (openrouterKeyIndex + 1) % OPENROUTER_API_KEYS.length;
  return key;
}

export function getNextChatGPTApiKey(): string {
  if (CHATGPT_API_KEYS.length === 0) {
    return process.env.CHATGPT_API_KEY || "";
  }

  const key = CHATGPT_API_KEYS[chatgptKeyIndex];
  chatgptKeyIndex = (chatgptKeyIndex + 1) % CHATGPT_API_KEYS.length;
  return key;
}

export function getNextApiKey(): string {
  return getNextGeminiApiKey();
}

export function getNextApiKeyForProvider(provider: "gemini" | "openai" | "openrouter" | "chatgpt"): string {
  switch (provider) {
    case "gemini":
      return getNextGeminiApiKey();
    case "openai":
      return getNextOpenAIApiKey();
    case "openrouter":
      return getNextOpenRouterApiKey();
    case "chatgpt":
      return getNextChatGPTApiKey();
    default:
      return getNextGeminiApiKey();
  }
}
