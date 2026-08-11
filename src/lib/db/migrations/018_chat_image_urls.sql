-- Migration 018: Add image_urls column to chat_messages
-- Allows storing up to 3 image paths per message for multimodal chat
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]';
