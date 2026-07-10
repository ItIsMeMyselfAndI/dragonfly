import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { getUserApiKeys, saveUserApiKeys } from "@/lib/settings/server";
import { ProviderType } from "@/lib/ai/types";

export async function GET() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const keys = await getUserApiKeys(user.id);
  return NextResponse.json({ keys });
}

export async function POST(req: Request) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}) as { keys?: Record<string, string> });
  const keys = (body.keys ?? {}) as Partial<Record<ProviderType, string>>;
  try {
    await saveUserApiKeys(user.id, keys);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save API keys" },
      { status: 500 },
    );
  }
}
