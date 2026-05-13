-- Migration: adicionar tabela meals
-- Executar no SQL Editor do Supabase (https://supabase.com/dashboard)

CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  data_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
  tipo_refeicao TEXT NOT NULL DEFAULT 'almoco',
  foto_path TEXT,
  itens JSONB NOT NULL DEFAULT '[]'::jsonb,
  macros JSONB,
  classificacao TEXT,
  observacao TEXT NOT NULL DEFAULT '',
  texto_livre TEXT NOT NULL DEFAULT '',
  status_analise TEXT NOT NULL DEFAULT 'pendente',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_user_data ON meals(user_id, data_hora);
