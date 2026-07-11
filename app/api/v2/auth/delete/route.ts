import { NextResponse } from "next/server";
import {
  createServerClient,
  createServiceClient,
} from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const service = createServiceClient();

    // Flag the profile row as disabled (soft delete) — keeps the footprint.
    const { error: profileError } = await service
      .from("profiles")
      .update({ disabled: true, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (profileError) throw profileError;

    // Ban (disable) the auth user so they cannot log in again. The
    // auth.users row is preserved — combined with the profiles.disabled flag
    // this is a soft delete that keeps the user's footprint.
    const { error: authError } = await service.auth.admin.updateUserById(
      user.id,
      { ban_duration: "8784h" },
    );

    if (authError) throw authError;

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Delete account error:", e);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
}
