-- Adiciona coluna gratitude_photos (JSONB array) para fotos de gratidão no check-in
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS gratitude_photos jsonb NOT NULL DEFAULT '[]'::jsonb;
