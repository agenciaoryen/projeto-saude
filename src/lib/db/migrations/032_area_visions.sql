-- ── Area Visions — 5-year vision statements per life area ────────────────────
CREATE TABLE IF NOT EXISTS area_visions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  area TEXT NOT NULL,
  statement TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, area)
);

CREATE INDEX IF NOT EXISTS idx_area_visions_user ON area_visions(user_id);
