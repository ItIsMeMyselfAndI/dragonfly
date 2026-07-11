import crypto from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { ProviderType } from "@/lib/ai/types";
import { userKeyManager } from "@/lib/ai/userKeyConfig";
import { ProviderConfigManager } from "@/lib/ai/providerConfig";
import { UserSettings, DEFAULT_USER_SETTINGS } from "./types";

const ALGO = "aes-256-gcm";
const SECRET = process.env.SETTINGS_ENCRYPTION_SECRET;

interface EncryptedBlob {
  iv: string;
  tag: string;
  data: string;
}

function getKey(): Buffer {
  if (!SECRET) {
    throw new Error("SETTINGS_ENCRYPTION_SECRET is not configured");
  }
  return crypto.createHash("sha256").update(SECRET).digest();
}

function encrypt(plain: string): EncryptedBlob {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64"),
  };
}

function decrypt(blob: EncryptedBlob): string {
  const key = getKey();
  const decipher = crypto.createDecipheriv(
    ALGO,
    key,
    Buffer.from(blob.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(blob.tag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(blob.data, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export type ServerUserApiKeys = Partial<Record<ProviderType, string[]>>;

interface StoredApiKeys {
  enabled: boolean;
  keys: ServerUserApiKeys;
}

function parseStored(raw: unknown): StoredApiKeys {
  if (raw && typeof raw === "object" && "keys" in (raw as object)) {
    const r = raw as StoredApiKeys;
    return { enabled: !!r.enabled, keys: r.keys ?? {} };
  }
  // Legacy shape: the keys map was stored directly.
  return { enabled: true, keys: (raw as ServerUserApiKeys) ?? {} };
}

async function readStored(userId: string): Promise<StoredApiKeys> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("encrypted_api_keys")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data?.encrypted_api_keys) return { enabled: false, keys: {} };
  try {
    return parseStored(JSON.parse(decrypt(data.encrypted_api_keys as EncryptedBlob)));
  } catch {
    return { enabled: false, keys: {} };
  }
}

function nonEmpty(keys: ServerUserApiKeys): ServerUserApiKeys {
  const result: ServerUserApiKeys = {};
  (Object.keys(keys) as ProviderType[]).forEach((provider) => {
    const arr = (keys[provider] ?? [])
      .map((k) => (k ?? "").trim())
      .filter((k) => k.length > 0);
    if (arr.length) result[provider] = arr;
  });
  return result;
}

export async function getUserApiKeys(
  userId: string,
): Promise<ServerUserApiKeys> {
  const stored = await readStored(userId);
  if (!stored.enabled) return {};
  return nonEmpty(stored.keys);
}

export async function getUseOwnKeys(userId: string): Promise<boolean> {
  const stored = await readStored(userId);
  return stored.enabled;
}

export async function isUsingOwnKeys(userId: string): Promise<boolean> {
  const stored = await readStored(userId);
  if (!stored.enabled) return false;
  return Object.values(stored.keys).some((arr) =>
    (arr ?? []).some((k) => k && k.trim().length > 0),
  );
}

export async function getUserApiKeyState(
  userId: string,
): Promise<{ enabled: boolean; keys: ServerUserApiKeys }> {
  const stored = await readStored(userId);
  return { enabled: stored.enabled, keys: nonEmpty(stored.keys) };
}

export async function saveUserApiKeys(
  userId: string,
  keys: ServerUserApiKeys,
  enabled: boolean,
): Promise<void> {
  const cleaned = nonEmpty(keys);

  const supabase = await createServerClient();
  const payload =
    Object.keys(cleaned).length > 0
      ? (encrypt(
          JSON.stringify({ enabled, keys: cleaned }),
        ) as unknown as Record<string, unknown>)
      : null;

  const { error } = await supabase
    .from("profiles")
    .update({
      encrypted_api_keys: payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}

export async function hasUserApiKeys(userId: string): Promise<boolean> {
  return isUsingOwnKeys(userId);
}

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("settings")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data?.settings) return { ...DEFAULT_USER_SETTINGS };
  const stored = data.settings as Partial<UserSettings>;
  return {
    defaultProvider: stored.defaultProvider ?? DEFAULT_USER_SETTINGS.defaultProvider,
    defaultModel: stored.defaultModel ?? DEFAULT_USER_SETTINGS.defaultModel,
    notificationsEnabled:
      stored.notificationsEnabled ?? DEFAULT_USER_SETTINGS.notificationsEnabled,
  };
}

export async function saveUserSettings(
  userId: string,
  settings: UserSettings,
): Promise<void> {
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      settings,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

export interface ProviderAccess {
  available: boolean;
  userApiKey?: string;
}

export async function resolveProviderAccess(
  user: { id: string } | null,
  provider: ProviderType,
): Promise<ProviderAccess> {
  const appAvailable = new ProviderConfigManager().isProviderAvailable(provider);

  if (!user) {
    return { available: appAvailable };
  }

  const keys = await getUserApiKeys(user.id);
  const ownKeys = keys[provider] ?? [];
  userKeyManager.seed(user.id, provider, ownKeys);
  const ownAvailable = ownKeys.length > 0;

  if (!appAvailable && !ownAvailable) {
    return { available: false };
  }

  return {
    available: true,
    userApiKey: ownAvailable
      ? userKeyManager.getNextUserKey(user.id, provider)
      : undefined,
  };
}
