-- Adiciona coluna stone_rank para vincular tarefas às pedras da semana (I, II, III)
ALTER TABLE weekly_tasks ADD COLUMN IF NOT EXISTS stone_rank SMALLINT CHECK (stone_rank BETWEEN 1 AND 3);
