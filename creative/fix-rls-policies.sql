-- Fix RLS Policies for Existing Tables
-- Run this if you already have the tables and are getting RLS errors

-- Disable RLS for creative_messages
ALTER TABLE creative_messages DISABLE ROW LEVEL SECURITY IF EXISTS;

-- Disable RLS for creative_notifications  
ALTER TABLE creative_notifications DISABLE ROW LEVEL SECURITY IF EXISTS;

-- Drop any existing policies (safe to run even if they don't exist)
DROP POLICY IF EXISTS "Users can read own messages" ON creative_messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON creative_messages;
DROP POLICY IF EXISTS "Users can update received messages" ON creative_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON creative_messages;

DROP POLICY IF EXISTS "Users can read own notifications" ON creative_notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON creative_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON creative_notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON creative_notifications;

-- Grant full permissions
GRANT ALL ON creative_messages TO authenticated;
GRANT ALL ON creative_messages TO service_role;
GRANT ALL ON creative_notifications TO authenticated;
GRANT ALL ON creative_notifications TO service_role;

DO $$
BEGIN
  RAISE NOTICE 'RLS policies have been disabled and full permissions granted';
  RAISE NOTICE 'This should fix the "row-level security policy" error';
END $$;