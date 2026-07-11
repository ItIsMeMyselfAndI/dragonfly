import { ProviderType } from "@/lib/ai/types";

type ProviderAvailability = Record<ProviderType, boolean>;

export async function getProviderAvailability(): Promise<ProviderAvailability> {
  const response = await fetch("/api/v2/generate/providers", {
    method: "GET",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to load provider availability");
  }
  const data = (await response.json()) as { available: ProviderAvailability };
  return data.available;
}
