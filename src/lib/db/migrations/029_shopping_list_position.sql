-- ── Position column for drag-and-drop ordering ──────────────────────────
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_shopping_items_position ON shopping_items(user_id, position);
