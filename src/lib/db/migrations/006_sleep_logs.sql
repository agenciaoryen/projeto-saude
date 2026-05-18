-- Tabela de registros de sono
-- source: 'checkin' | 'battery' | 'visibility' | 'google_fit'
CREATE TABLE IF NOT EXISTS sleep_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  date          DATE NOT NULL,                      -- data do DESPERTAR (dia seguinte ao dormir)
  sleep_start   TIMESTAMPTZ,                         -- hora que dormiu (estimada ou informada)
  sleep_end     TIMESTAMPTZ,                         -- hora que acordou
  duration_min  INTEGER,                             -- duração em minutos
  quality       SMALLINT CHECK (quality BETWEEN 1 AND 5), -- 1=péssimo 5=ótimo
  interruptions SMALLINT DEFAULT 0,                 -- quantas vezes acordou
  had_dreams    BOOLEAN,
  notes         TEXT,
  source        TEXT NOT NULL DEFAULT 'checkin',    -- origem do registro
  raw_data      JSONB,                              -- dados brutos (battery events etc.)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date, source)
);

-- Push subscriptions para notificações
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  endpoint   TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, endpoint)
);
