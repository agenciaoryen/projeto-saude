-- Add mood_tags array to check_ins for structured emotion tracking
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS mood_tags TEXT[] NOT NULL DEFAULT '{}';
