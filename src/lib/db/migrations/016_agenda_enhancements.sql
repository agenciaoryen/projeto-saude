-- ── Agenda enhancements ──────────────────────────────────────────────────────
ALTER TABLE agenda_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE agenda_items ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE agenda_items ADD COLUMN IF NOT EXISTS repeat_type TEXT DEFAULT 'none' CHECK (repeat_type IN ('none', 'daily', 'weekly', 'monthly', 'yearly', 'weekdays'));
ALTER TABLE agenda_items ADD COLUMN IF NOT EXISTS notify_minutes INTEGER;
ALTER TABLE agenda_items ADD COLUMN IF NOT EXISTS due_date DATE;
