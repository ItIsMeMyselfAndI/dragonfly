import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/server";
import { buildIdentifier, checkRateLimit } from "@/lib/rate-limit/server";
import { isUsingOwnKeys } from "@/lib/settings/server";

const SPECS_API_PATTERN = /^\/api\/v2\/generate\/specs/;

export async function proxy(request: NextRequest) {
  // Only the specs endpoint marks the start of a generation.
  if (!SPECS_API_PATTERN.test(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const supabase = createMiddlewareClient(request, response);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const deviceId = request.headers.get("x-device-id");

  // Users who enabled their own API keys bypass the app limit.
  let bypassLimit = false;
  if (user) {
    bypassLimit = await isUsingOwnKeys(user.id);
  }

  if (bypassLimit) {
    return response;
  }

  const identifier = buildIdentifier(user?.id ?? null, deviceId);

  // Read-only check: reject up front if already exhausted. The actual quota
  // increment happens once, after the full pipeline syncs to the database.
  const status = await checkRateLimit(supabase, identifier);
  if (!status.allowed) {
    return NextResponse.json(
      {
        error: "Daily generation limit reached",
        limit: status.limit,
        remaining: 0,
        message: user
          ? `You've used all ${status.limit} generations today. Add your API keys to lift the limit and use your provider's quota.`
          : `You've used all ${status.limit} free generations today. Sign up for more.`,
      },
      { status: 429 },
    );
  }

  return response;
}

export const config = {
  matcher: ["/api/v2/generate/specs"],
};
