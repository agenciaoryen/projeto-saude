-- ── User Categories (categorias financeiras customizadas) ────────────────────
CREATE TABLE IF NOT EXISTS user_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  name       TEXT NOT NULL,
  emoji      TEXT NOT NULL DEFAULT '⭐',
  hue        INTEGER NOT NULL DEFAULT 270,
  subcats    TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_cats_user ON user_categories(user_id, type);
