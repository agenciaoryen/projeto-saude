-- ── Add chat_type to chat_messages (separate Maya vs Nutrition) ──────────────
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS chat_type TEXT;
-- Backfill: existing messages are from Maya
UPDATE chat_messages SET chat_type = 'maya' WHERE chat_type IS NULL;
