import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { buildIdentifier, checkRateLimit } from "@/lib/rate-limit/server";
import { isUsingOwnKeys } from "@/lib/settings/server";

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get device ID from header
    const deviceId = request.headers.get("x-device-id");

    // Build identifier
    const identifier = buildIdentifier(user?.id ?? null, deviceId);

    const result = await checkRateLimit(supabase, identifier);

    // Users with their own API keys are not subject to the app limit.
    const unlimited = user ? await isUsingOwnKeys(user.id) : false;

    // Calculate when the limit resets (midnight UTC)
    const now = new Date();
    const tomorrow = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
    );
    const resetsAt = tomorrow.toISOString();

    return NextResponse.json({
      limit: result.limit,
      remaining: result.remaining,
      used: result.used,
      resetsAt,
      isGuest: !user,
      unlimited,
    });
  } catch (error) {
    console.error("Rate limit status error:", error);
    return NextResponse.json(
      { error: "Failed to check rate limit status" },
      { status: 500 },
    );
  }
}
