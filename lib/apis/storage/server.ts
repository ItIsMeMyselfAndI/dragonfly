import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.SUPABASE_STORAGE_BUCKET_NAME;

function getAdminClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase environment variables are missing");
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function uploadFile(path: string, file: Buffer, contentType: string) {
  if (!bucketName) throw new Error("Bucket name is missing");
  const { data, error } = await getAdminClient().storage
    .from(bucketName)
    .upload(path, file, { contentType, upsert: true });
  if (error) throw error;
  return data;
}

export async function deleteFile(path: string) {
  if (!bucketName) throw new Error("Bucket name is missing");
  const { error } = await getAdminClient().storage
    .from(bucketName)
    .remove([path]);
  if (error) throw error;
}

export async function getFileUrl(path: string) {
  if (!bucketName) throw new Error("Bucket name is missing");
  const { data } = getAdminClient().storage
    .from(bucketName)
    .getPublicUrl(path);
  return data.publicUrl;
}
