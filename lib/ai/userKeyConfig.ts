import { ProviderType } from "./types";

type UserKeyMap = Map<ProviderType, { keys: string[]; index: number }>;

class UserKeyManager {
  private cache = new Map<string, UserKeyMap>();

  seed(userId: string, provider: ProviderType, keys: string[]): void {
    const cleaned = (keys ?? [])
      .map((k) => (k ?? "").trim())
      .filter((k) => k.length > 0);
    let userMap = this.cache.get(userId);
    if (!userMap) {
      userMap = new Map();
      this.cache.set(userId, userMap);
    }
    const existing = userMap.get(provider);
    if (existing) {
      existing.keys = cleaned;
      if (existing.index >= cleaned.length) existing.index = 0;
    } else {
      userMap.set(provider, { keys: cleaned, index: 0 });
    }
  }

  getNextUserKey(userId: string, provider: ProviderType): string | undefined {
    const userMap = this.cache.get(userId);
    const entry = userMap?.get(provider);
    if (!entry || entry.keys.length === 0) return undefined;
    const key = entry.keys[entry.index % entry.keys.length];
    entry.index += 1;
    return key;
  }

  hasKeys(userId: string, provider: ProviderType): boolean {
    const entry = this.cache.get(userId)?.get(provider);
    return !!entry && entry.keys.length > 0;
  }
}

export const userKeyManager = new UserKeyManager();
