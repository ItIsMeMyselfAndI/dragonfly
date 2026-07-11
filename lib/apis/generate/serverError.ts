import { NextResponse } from "next/server";

/**
 * Normalize a provider/generation failure into an HTTP response whose status
 * lets the client decide whether to retry:
 *   - 429 / 5xx from the upstream provider -> keep that status (retriable)
 *   - other 4xx (bad key, invalid model)     -> 400 (do NOT retry)
 *   - unknown (network/generic)              -> 500 (retriable, best effort)
 */
function isApiKeyError(error: unknown): boolean {
  const text = error instanceof Error ? error.message : String(error);
  return (
    /api[ _-]?key (is )?(not valid|invalid)/i.test(text) ||
    text.includes("API_KEY_INVALID")
  );
}

export function generationErrorResponse(error: unknown): NextResponse {
  const message =
    error instanceof Error ? error.message : "Generation failed";
  const upstream = (error as { status?: number })?.status;

  let httpStatus = 500;
  if (typeof upstream === "number") {
    if (upstream === 429 || (upstream >= 500 && upstream <= 599)) {
      httpStatus = upstream;
    } else {
      httpStatus = 400;
    }
  }

  const code = isApiKeyError(error) ? "API_KEY_INVALID" : "GENERATION_FAILED";

  return NextResponse.json({ error: message, code }, { status: httpStatus });
}
