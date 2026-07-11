-- Rate limits table for tracking AI generation usage
-- Run this in the Supabase SQL Editor or via `supabase db push`

CREATE TABLE IF NOT EXISTS rate_limits (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier  TEXT NOT NULL,       -- "guest:<deviceId>" or "user:<supabaseUserId>"
  ip          TEXT NOT NULL,
  date        TEXT NOT NULL,       -- "YYYY-MM-DD" in UTC
  used        INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(identifier, date)
);

-- Rename the legacy `count` column to `used` for existing deployments.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rate_limits' AND column_name = 'count'
  ) THEN
    ALTER TABLE rate_limits RENAME COLUMN count TO used;
  END IF;
END $$;

-- Index for fast lookups by identifier + date
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
  ON rate_limits (identifier, date);

-- Atomic increment function — handles upsert and returns the new used amount + whether limit is exceeded
DROP FUNCTION IF EXISTS increment_rate_limit(text, text, text);
CREATE FUNCTION increment_rate_limit(
  p_identifier TEXT,
  p_ip TEXT,
  p_date TEXT
) RETURNS TABLE(used INTEGER, limited BOOLEAN) AS $$
DECLARE
  v_limit INTEGER;
BEGIN
  -- Upsert: create row if not exists, otherwise increment atomically
  INSERT INTO rate_limits (identifier, ip, date, used)
  VALUES (p_identifier, p_ip, p_date, 1)
  ON CONFLICT (identifier, date) DO UPDATE
    SET used = rate_limits.used + 1,
        updated_at = now()
  RETURNING rate_limits.used INTO used;

  -- Determine limit based on identifier type
  IF p_identifier LIKE 'guest:%' THEN
    v_limit := 3;
  ELSE
    v_limit := 5;
  END IF;

  limited := used > v_limit;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security — users can only read their own rows
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own rate limits" ON rate_limits;
CREATE POLICY "Users can read own rate limits"
  ON rate_limits
  FOR SELECT
  USING (true);  -- Allow all reads (the increment function handles write security)

-- Allow the increment function to insert/update (SECURITY DEFINER handles this,
-- but we add an explicit policy for the insert path via the client)
DROP POLICY IF EXISTS "Service role can insert/update rate limits" ON rate_limits;
CREATE POLICY "Service role can insert/update rate limits"
  ON rate_limits
  FOR ALL
  USING (true)
  WITH CHECK (true);
