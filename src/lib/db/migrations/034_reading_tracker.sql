-- ── Controlador de Leitura ────────────────────────────────────────────────
-- Rastreador de hábito de leitura (substitui a biblioteca Gutenberg).
-- O app NÃO hospeda conteúdo de livros — só acompanha o hábito de ler.

-- Livros (biblioteca manual do usuário)
CREATE TABLE IF NOT EXISTS reading_books (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  title         TEXT NOT NULL,
  author        TEXT,
  emoji         TEXT DEFAULT '📖',
  genre         TEXT,
  total_pages   INTEGER,
  current_page  INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'quero_ler',  -- quero_ler | lendo | concluido | abandonado
  notes         TEXT,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reading_books_user ON reading_books(user_id, status);

-- Sessões de leitura (registro diário do hábito)
CREATE TABLE IF NOT EXISTS reading_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  book_id       UUID REFERENCES reading_books(id) ON DELETE SET NULL,
  book_title    TEXT NOT NULL,        -- snapshot do título (sobrevive à remoção do livro)
  date          TEXT NOT NULL,        -- YYYY-MM-DD (data local do usuário)
  pages_read    INTEGER NOT NULL DEFAULT 0,
  minutes_read  INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_date ON reading_sessions(user_id, date);

-- Meta diária do usuário (páginas ou minutos por dia)
CREATE TABLE IF NOT EXISTS reading_settings (
  user_id          UUID PRIMARY KEY,
  daily_goal_type  TEXT NOT NULL DEFAULT 'minutes',  -- 'pages' | 'minutes'
  daily_goal_value INTEGER NOT NULL DEFAULT 15,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
