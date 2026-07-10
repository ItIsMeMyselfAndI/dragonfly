-- User-provided API keys (encrypted at rest)
-- Run this in the Supabase SQL Editor (after 002_profiles.sql)
-- Keys are stored encrypted via the app (AES-256-GCM) using SETTINGS_ENCRYPTION_SECRET;
-- this column only ever holds ciphertext, never plaintext.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS encrypted_api_keys JSONB;

COMMENT ON COLUMN profiles.encrypted_api_keys IS
  'Encrypted per-provider API keys supplied by the user. Removes the app generation limit while set.';
