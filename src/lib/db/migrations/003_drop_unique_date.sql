-- Remove a restrição de uma entrada por dia no diário
-- Agora o usuário pode ter múltiplas entradas no mesmo dia (livre + evolução, etc.)
DROP INDEX IF EXISTS user_date_diary_idx;
