import { ProviderType } from "@/lib/ai/types";
import { UserSettings, DEFAULT_USER_SETTINGS } from "./types";

export type UserApiKeys = Partial<Record<ProviderType, string[]>>;

export interface ApiKeysResponse {
  enabled: boolean;
  keys: UserApiKeys;
}

export async function getApiKeys(): Promise<ApiKeysResponse> {
  const response = await fetch("/api/v2/settings/api-keys", {
    method: "GET",
  });
  if (!response.ok) return { enabled: false, keys: {} };
  const data = await response.json();
  return {
    enabled: !!data.enabled,
    keys: (data.keys ?? {}) as UserApiKeys,
  };
}

export async function saveApiKeys(
  keys: UserApiKeys,
  enabled: boolean,
): Promise<void> {
  const response = await fetch("/api/v2/settings/api-keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keys, enabled }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to save API keys");
  }
}

export async function getUserSettings(): Promise<UserSettings> {
  const response = await fetch("/api/v2/settings", {
    method: "GET",
  });
  if (!response.ok) return { ...DEFAULT_USER_SETTINGS };
  return (await response.json()) as UserSettings;
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  const response = await fetch("/api/v2/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to save settings");
  }
}
