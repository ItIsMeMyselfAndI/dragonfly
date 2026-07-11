import { SupabaseClient } from "@supabase/supabase-js";

const GUEST_DAILY_LIMIT = 3;
const AUTH_DAILY_LIMIT = 5;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  used: number;
}

/**
 * Get today's date string in UTC (YYYY-MM-DD).
 */
function getTodayUTC(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Build the identifier string from user info.
 */
export function buildIdentifier(
  userId: string | null,
  deviceId: string | null,
): string {
  if (userId) return `user:${userId}`;
  if (deviceId) return `guest:${deviceId}`;
  return "guest:anonymous";
}

/**
 * Check the current rate limit without incrementing.
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  identifier: string,
): Promise<RateLimitResult> {
  const today = getTodayUTC();
  const limit = identifier.startsWith("guest:")
    ? GUEST_DAILY_LIMIT
    : AUTH_DAILY_LIMIT;

  const { data, error } = await supabase
    .from("rate_limits")
    .select("used")
    .eq("identifier", identifier)
    .eq("date", today)
    .maybeSingle();

  if (error) {
    console.error("Rate limit check error:", error);
    // Fail open — allow the request if we can't check
    return { allowed: true, remaining: limit, limit, used: 0 };
  }

  const usedCount = data?.used ?? 0;
  const remaining = Math.max(0, limit - usedCount);

  return {
    allowed: usedCount < limit,
    remaining,
    limit,
    used: usedCount,
  };
}

/**
 * Consume one generation — atomically increment the used count.
 * Returns the updated rate limit info.
 */
export async function consumeRateLimit(
  supabase: SupabaseClient,
  identifier: string,
  ip: string,
): Promise<RateLimitResult> {
  const today = getTodayUTC();
  const limit = identifier.startsWith("guest:")
    ? GUEST_DAILY_LIMIT
    : AUTH_DAILY_LIMIT;

  // Use the atomic RPC function
  const { data, error } = await supabase.rpc("increment_rate_limit", {
    p_identifier: identifier,
    p_ip: ip,
    p_date: today,
  });

  if (error) {
    console.error("Rate limit consume error:", error);
    // Fail open — allow the request if we can't track
    return { allowed: true, remaining: limit, limit, used: 0 };
  }

  const row = data?.[0];
  const usedCount = row?.used ?? 0;
  const limited = row?.limited ?? false;
  const remaining = Math.max(0, limit - usedCount);

  return {
    allowed: !limited,
    remaining,
    limit,
    used: usedCount,
  };
}
