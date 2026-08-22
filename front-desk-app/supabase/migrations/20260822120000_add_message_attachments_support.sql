-- ============================================================
-- Vector Front Desk ERP — Message Attachments Feature
-- Migration: 20260822120000_add_message_attachments_support
-- Description: Adds attached_files support to messages and
--              creates storage bucket for message file attachments
-- ============================================================

-- Add attached_files column to messages table
ALTER TABLE IF EXISTS public.messages 
  ADD COLUMN IF NOT EXISTS attached_files TEXT[] DEFAULT '{}';

-- Create message-attachments storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Grant access to the message-attachments bucket
GRANT ALL ON storage.objects TO anon, authenticated;

-- Drop existing policies if they exist (to avoid errors on rerun)
DROP POLICY IF EXISTS "Authenticated users can upload message attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view message attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete message attachments" ON storage.objects;

-- Policies for the bucket
CREATE POLICY "Authenticated users can upload message attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'message-attachments'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can view message attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete message attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND auth.role() = 'authenticated'
);
