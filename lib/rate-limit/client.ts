import { getOrCreateDeviceId } from "@/lib/device";

export interface RateLimitStatus {
  limit: number;
  remaining: number;
  used: number;
  resetsAt: string;
  isGuest: boolean;
  unlimited?: boolean;
}

/**
 * Fetch the current rate limit status from the server.
 */
export async function getRateLimitStatus(): Promise<RateLimitStatus> {
  const response = await fetch("/api/v2/rate-limit/status", {
    headers: { "x-device-id": getOrCreateDeviceId() },
  });

  if (!response.ok) {
    // Fail gracefully — assume unlimited if we can't check
    return { limit: 10, remaining: 10, used: 0, resetsAt: "", isGuest: true };
  }

  return response.json();
}

/**
 * Consume one generation from the daily allowance. Intended to be called
 * exactly once, after the full generation pipeline (specs, BOM, visual flow,
 * PDF) has succeeded and synced to the database — so retries on individual
 * AI calls never burn allowance.
 */
export async function consumeRateLimitQuota(): Promise<void> {
  try {
    await fetch("/api/v2/rate-limit/consume", {
      method: "POST",
      headers: { "x-device-id": getOrCreateDeviceId() },
    });
  } catch (e) {
    console.error("Failed to consume rate limit quota:", e);
  }
}
