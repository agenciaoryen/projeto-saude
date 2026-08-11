-- ── Shopping list ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopping_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  item_name  TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT 'geral',
  checked    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shopping_items_user ON shopping_items(user_id);
