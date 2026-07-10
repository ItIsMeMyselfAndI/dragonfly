import crypto from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { ProviderType } from "@/lib/ai/types";

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

export type ServerUserApiKeys = Partial<Record<ProviderType, string>>;

export async function getUserApiKeys(
  userId: string,
): Promise<ServerUserApiKeys> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("encrypted_api_keys")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data?.encrypted_api_keys) return {};
  try {
    const blob = data.encrypted_api_keys as EncryptedBlob;
    return JSON.parse(decrypt(blob)) as ServerUserApiKeys;
  } catch {
    return {};
  }
}

export async function saveUserApiKeys(
  userId: string,
  keys: ServerUserApiKeys,
): Promise<void> {
  const cleaned: ServerUserApiKeys = {};
  (Object.keys(keys) as ProviderType[]).forEach((provider) => {
    const value = keys[provider];
    if (value && value.trim()) cleaned[provider] = value.trim();
  });

  const supabase = await createServerClient();
  const payload = Object.keys(cleaned).length
    ? (encrypt(JSON.stringify(cleaned)) as unknown as Record<string, unknown>)
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
  const keys = await getUserApiKeys(userId);
  return Object.values(keys).some((value) => !!value);
}
