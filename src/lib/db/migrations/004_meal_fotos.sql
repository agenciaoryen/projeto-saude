-- Adiciona coluna fotos (JSONB array) para múltiplas fotos por refeição
ALTER TABLE meals ADD COLUMN IF NOT EXISTS fotos jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Migra dados existentes: foto_path único vira array com 1 elemento
UPDATE meals SET fotos = jsonb_build_array(foto_path) WHERE foto_path IS NOT NULL AND (fotos IS NULL OR fotos = '[]'::jsonb);
