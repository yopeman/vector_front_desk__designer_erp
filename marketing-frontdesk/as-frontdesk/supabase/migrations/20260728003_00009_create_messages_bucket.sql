-- ============================================================
-- Vector Front Desk ERP — Messages Feature
-- Migration: 20260728003_00009_create_messages_bucket
-- Description: Creates a storage bucket for message file attachments
--              and adds composite indexes for conversation queries
-- ============================================================

-- Create messages storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('messages', 'messages', false)
ON CONFLICT (id) DO NOTHING;

-- Grant access to the messages bucket
GRANT ALL ON storage.objects TO anon, authenticated;

-- Add composite index for fast conversation lookups
CREATE INDEX IF NOT EXISTS idx_messages_conversation
ON messages(sender_id, receiver_id, created_at);

-- Add index for unread message counts
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread
ON messages(receiver_id, is_read)
WHERE is_read = FALSE;