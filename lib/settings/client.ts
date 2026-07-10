"use client";

import { ProviderType } from "@/lib/ai/types";

export type UserApiKeys = Partial<Record<ProviderType, string>>;

export async function getApiKeys(): Promise<UserApiKeys> {
  const response = await fetch("/api/v2/settings/api-keys", {
    method: "GET",
  });
  if (!response.ok) return {};
  const data = await response.json();
  return (data.keys ?? {}) as UserApiKeys;
}

export async function saveApiKeys(keys: UserApiKeys): Promise<void> {
  const response = await fetch("/api/v2/settings/api-keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keys }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to save API keys");
  }
}
