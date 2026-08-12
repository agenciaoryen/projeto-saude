-- ── Módulo de Leitura: livros salvos e progresso ──────────────────────────
CREATE TABLE IF NOT EXISTS user_books (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  book_id       INTEGER NOT NULL,
  title         TEXT NOT NULL,
  author        TEXT,
  cover_url     TEXT,
  status        TEXT NOT NULL DEFAULT 'want_to_read',
  progress      INTEGER NOT NULL DEFAULT 0,
  total_pages   INTEGER,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_user_books_user ON user_books(user_id, status);
