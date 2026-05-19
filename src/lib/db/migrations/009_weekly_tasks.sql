-- ── Multiple main focuses on weekly_plans ────────────────────────────────────
ALTER TABLE weekly_plans ADD COLUMN IF NOT EXISTS main_focus_2 TEXT;
ALTER TABLE weekly_plans ADD COLUMN IF NOT EXISTS main_focus_3 TEXT;

-- ── Weekly Tasks ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_plan_id    UUID NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL,
  title             TEXT NOT NULL,
  area              TEXT NOT NULL CHECK (area IN (
                      'saude', 'carreira', 'financas', 'relacionamentos',
                      'desenvolvimento', 'familia', 'lazer', 'espiritualidade', 'outros'
                    )),
  task_type         TEXT NOT NULL DEFAULT 'manutencao'
                      CHECK (task_type IN ('crescimento', 'manutencao')),
  linked_goal_id    UUID REFERENCES goals(id) ON DELETE SET NULL,
  linked_action_id  UUID REFERENCES goal_actions(id) ON DELETE SET NULL,
  day_of_week       INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
                    -- 0 = Segunda, 1 = Terça, 2 = Quarta, 3 = Quinta
                    -- 4 = Sexta,   5 = Sábado, 6 = Domingo
  scheduled_time    TIME,
  status            TEXT NOT NULL DEFAULT 'pendente'
                      CHECK (status IN ('pendente', 'concluida', 'pulada')),
  position          INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS weekly_tasks_plan_idx ON weekly_tasks(weekly_plan_id);
CREATE INDEX IF NOT EXISTS weekly_tasks_user_idx ON weekly_tasks(user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_weekly_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS weekly_tasks_updated_at ON weekly_tasks;
CREATE TRIGGER weekly_tasks_updated_at
  BEFORE UPDATE ON weekly_tasks
  FOR EACH ROW EXECUTE FUNCTION update_weekly_tasks_updated_at();
