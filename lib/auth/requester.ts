import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";

export interface Requester {
  id: string;
  isGuest: boolean;
}

const GUEST_COOKIE = "guest_id";

/**
 * Resolve the current requester without any per-request network call.
 *
 * - For authenticated users we read the session JWT locally from the cookie
 *   via `getSession()` (no Supabase Auth network round-trip).
 * - For guests we fall back to a stable anonymous id stored in an httpOnly
 *   cookie, generating and persisting one on first request.
 *
 * This is used to scope projects per-user: authenticated users get their own
 * id, guests get an isolated anonymous id, and shared/public projects are
 * visible to everyone.
 */
export async function getRequester(): Promise<Requester> {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user?.id) {
    return { id: session.user.id, isGuest: false };
  }

  const cookieStore = await cookies();
  let guestId = cookieStore.get(GUEST_COOKIE)?.value;

  if (!guestId) {
    guestId = randomUUID();
    cookieStore.set(GUEST_COOKIE, guestId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return { id: guestId, isGuest: true };
}
