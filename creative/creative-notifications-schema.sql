-- Creative Portal Notifications Schema
-- This migration creates the notification system for the creative portal

-- Create creative_notifications table
CREATE TABLE IF NOT EXISTS creative_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('general', 'prototype', 'idea', 'design', 'leave', 'resignation', 'experience', 'transfer', 'promotion', 'hire', 'budget', 'other')),
  related_entity_type VARCHAR(100),
  related_entity_id UUID,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_creative_notifications_user_id ON creative_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_creative_notifications_is_read ON creative_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_creative_notifications_created_at ON creative_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creative_notifications_category ON creative_notifications(category);

-- Enable Row Level Security
ALTER TABLE creative_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON creative_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own notifications (for system-generated notifications, this may be adjusted)
CREATE POLICY "Users can insert own notifications"
  ON creative_notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own notifications (to mark as read)
CREATE POLICY "Users can update own notifications"
  ON creative_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON creative_notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON creative_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON creative_notifications TO service_role;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_creative_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER creative_notifications_updated_at
  BEFORE UPDATE ON creative_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_creative_notification_updated_at();

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_creative_unread_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unread_count
  FROM creative_notifications
  WHERE user_id = p_user_id AND is_read = false;
  
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_creative_unread_count(UUID) TO authenticated;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_creative_notifications_read(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE creative_notifications
  SET is_read = true, updated_at = NOW()
  WHERE user_id = p_user_id AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION mark_all_creative_notifications_read(UUID) TO authenticated;