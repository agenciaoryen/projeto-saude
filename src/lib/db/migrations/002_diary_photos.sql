-- Adiciona coluna photos (JSONB array de chaves do IndexedDB) à tabela diary_entries
ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS photos jsonb NOT NULL DEFAULT '[]'::jsonb;
