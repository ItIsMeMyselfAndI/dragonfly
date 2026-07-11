import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { getUserSettings, saveUserSettings } from "@/lib/settings/server";
import { ProviderType } from "@/lib/ai/types";
import { UserSettings, DEFAULT_USER_SETTINGS } from "@/lib/settings/types";

export async function GET() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const settings = await getUserSettings(user.id);
  return NextResponse.json(settings);
}

export async function POST(req: Request) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as Partial<UserSettings>;
  const settings: UserSettings = {
    defaultProvider:
      (body.defaultProvider as ProviderType) ?? DEFAULT_USER_SETTINGS.defaultProvider,
    defaultModel: body.defaultModel ?? DEFAULT_USER_SETTINGS.defaultModel,
    notificationsEnabled:
      body.notificationsEnabled ?? DEFAULT_USER_SETTINGS.notificationsEnabled,
  };
  try {
    await saveUserSettings(user.id, settings);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save settings" },
      { status: 500 },
    );
  }
}
