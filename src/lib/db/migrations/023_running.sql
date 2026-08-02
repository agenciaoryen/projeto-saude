-- Módulo de corrida
CREATE TABLE IF NOT EXISTS running_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  distance_meters REAL DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  avg_pace REAL, -- segundos por km
  max_speed REAL, -- km/h
  calories_estimate INTEGER,
  route_coordinates JSONB DEFAULT '[]', -- [{lat, lng, timestamp}]
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contador de loads Mapbox para monitorar custos
CREATE TABLE IF NOT EXISTS mapbox_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tiles_loaded INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
