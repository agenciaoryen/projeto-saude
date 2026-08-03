-- ── Goal source (origem da meta) ──────────────────────────────────────────────
ALTER TABLE goals ADD COLUMN IF NOT EXISTS source TEXT;
COMMENT ON COLUMN goals.source IS 'Origem da meta: "metas" (padrão) ou "financas"';
