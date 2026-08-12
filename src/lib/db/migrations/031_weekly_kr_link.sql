-- ── Link Key Results to Weekly Plans ───────────────────────────────────────────
ALTER TABLE weekly_plans ADD COLUMN IF NOT EXISTS linked_kr_id UUID REFERENCES key_results(id) ON DELETE SET NULL;
