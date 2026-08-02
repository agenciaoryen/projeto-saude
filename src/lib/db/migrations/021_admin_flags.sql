-- Tabela separada para flags de admin/tester (não misturar com user_preferences)
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY,
  is_admin BOOLEAN DEFAULT FALSE,
  is_tester BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migrar admin existente do context para a nova tabela
INSERT INTO user_roles (user_id, is_admin)
SELECT user_id, TRUE FROM user_preferences WHERE context->>'is_admin' = 'true'
ON CONFLICT (user_id) DO UPDATE SET is_admin = TRUE;
