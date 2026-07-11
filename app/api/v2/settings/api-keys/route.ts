import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import {
  getUserApiKeyState,
  saveUserApiKeys,
  isUsingOwnKeys,
} from "@/lib/settings/server";
import { ensurePromoRead } from "@/lib/apis/notification/mongo/server";
import { ProviderType } from "@/lib/ai/types";

export async function GET() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const state = await getUserApiKeyState(user.id);
  return NextResponse.json(state);
}

export async function POST(req: Request) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    keys?: Partial<Record<ProviderType, string[]>>;
    enabled?: boolean;
  };
  const keys = (body.keys ?? {}) as Partial<Record<ProviderType, string[]>>;
  const enabled = body.enabled ?? false;
  try {
    await saveUserApiKeys(user.id, keys, enabled);
    if (await isUsingOwnKeys(user.id)) {
      await ensurePromoRead(user.id).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save API keys" },
      { status: 500 },
    );
  }
}
