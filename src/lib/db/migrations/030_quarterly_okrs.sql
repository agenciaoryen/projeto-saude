-- ── Quarterly Cycles (Ciclos Trimestrais) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS quarterly_cycles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  label       TEXT NOT NULL,              -- "2026-Q3"
  year        INTEGER NOT NULL,          -- 2026
  quarter     INTEGER NOT NULL,          -- 1..4
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  theme       TEXT,                      -- "Trimestre do foco profissional"
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, label)
);

-- ── Key Results ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS key_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id        UUID NOT NULL REFERENCES quarterly_cycles(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL,
  title           TEXT NOT NULL,              -- "Ler 12 livros"
  target          REAL NOT NULL DEFAULT 100,  -- valor alvo
  current         REAL NOT NULL DEFAULT 0,    -- valor atual
  unit            TEXT NOT NULL DEFAULT '%',  -- '%', 'count', 'kg', 'min', 'km', 'R$'
  area            TEXT,                       -- 8 áreas da vida
  linked_goal_id  UUID REFERENCES goals(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  position        INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Quarterly Reviews ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quarterly_reviews (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id              UUID NOT NULL REFERENCES quarterly_cycles(id) ON DELETE CASCADE,
  overall_score         SMALLINT NOT NULL DEFAULT 5 CHECK (overall_score BETWEEN 1 AND 10),
  biggest_win           TEXT NOT NULL DEFAULT '',
  main_learning         TEXT NOT NULL DEFAULT '',
  what_to_carry_forward TEXT NOT NULL DEFAULT '',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cycle_id)
);

-- ── Indexes ─────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_quarterly_cycles_user ON quarterly_cycles(user_id, status);
CREATE INDEX IF NOT EXISTS idx_key_results_cycle     ON key_results(cycle_id, position);
CREATE INDEX IF NOT EXISTS idx_key_results_user      ON key_results(user_id);
