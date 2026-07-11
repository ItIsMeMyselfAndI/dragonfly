import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export interface SupabaseUser {
  id: string;
  email?: string;
}

/**
 * Create a Supabase client for API routes and Server Components.
 * Reads the auth session from cookies via next/headers.
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll called from a Server Component — ignore
        }
      },
    },
  });
}

/**
 * Create a Supabase client for middleware.
 * Reads/writes cookies directly on the request/response objects.
 */
export function createMiddlewareClient(
  request: NextRequest,
  response: NextResponse,
) {
  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        });
        if (headers) {
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        }
      },
    },
  });
}

/**
 * Create a lightweight Supabase client for server-side queries that don't
 * need cookie-based auth (e.g. the rate-limit RPC). Uses the service role
 * key so it can bypass RLS if needed.
 */
export function createServiceClient() {
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseAnonKey,
    { auth: { persistSession: false } },
  );
}

/**
 * Get the authenticated user from the request, or null if not authenticated.
 */
export async function getServerUser(): Promise<SupabaseUser | null> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? { id: user.id, email: user.email } : null;
  } catch {
    return null;
  }
}
