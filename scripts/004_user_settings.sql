-- Per-user app preferences (default AI provider, model, notification toggle)
-- Run this in the Supabase SQL Editor (after 002_profiles.sql).
-- Stored as JSONB on the profiles row; RLS already permits owners to UPDATE.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT
    '{"defaultProvider":"gemini","defaultModel":"gemini-2.5-flash-lite","notificationsEnabled":true}'::jsonb;

COMMENT ON COLUMN profiles.settings IS
  'Per-user app preferences: default AI provider, model, and notification toggle.';
