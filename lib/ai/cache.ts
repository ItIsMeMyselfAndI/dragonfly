import { ProviderType, APIResponse } from "./types";

export class APICache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private providerStats = new Map<ProviderType, number>();

  set(key: string, data: any, ttl: number = 300000, provider: ProviderType): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
    this.providerStats.set(provider, (this.providerStats.get(provider) || 0) + 1);
  }

  get(key: string): { data: any; provider: ProviderType } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    const provider = this.findProviderByEntry(entry);
    return provider ? { data: entry.data, provider } : null;
  }

  private findProviderByEntry(entry: { data: any; timestamp: number; ttl: number }): ProviderType | null {
    for (const [provider, count] of this.providerStats) {
      if (count > 0) {
        return provider;
      }
    }
    return null;
  }

  clear(): void {
    this.cache.clear();
    this.providerStats.clear();
  }

  getStats(): { cacheSize: number; providerUsage: Map<ProviderType, number> } {
    return {
      cacheSize: this.cache.size,
      providerUsage: new Map(this.providerStats),
    };
  }
}