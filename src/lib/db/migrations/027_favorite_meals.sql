-- ── Add favorited column to meals ──────────────────────────────────────────
ALTER TABLE meals ADD COLUMN IF NOT EXISTS favorited BOOLEAN DEFAULT false;
