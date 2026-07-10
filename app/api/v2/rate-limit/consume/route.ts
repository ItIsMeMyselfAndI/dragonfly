import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { buildIdentifier, consumeRateLimit } from "@/lib/rate-limit/server";
import { isUsingOwnKeys } from "@/lib/settings/server";

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const deviceId = request.headers.get("x-device-id");

    // Users who enabled their own API keys are not subject to the app limit.
    if (user && (await isUsingOwnKeys(user.id))) {
      return NextResponse.json({ bypassed: true });
    }

    const identifier = buildIdentifier(user?.id ?? null, deviceId);

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const result = await consumeRateLimit(supabase, identifier, ip);

    return NextResponse.json({
      limit: result.limit,
      remaining: result.remaining,
      used: result.used,
    });
  } catch (error) {
    console.error("Rate limit consume error:", error);
    // Fail open — don't block a successful generation over a tracking error.
    return NextResponse.json({ error: "Failed to consume rate limit" });
  }
}
