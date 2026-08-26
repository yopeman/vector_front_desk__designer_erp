-- Creative Portal Messages Schema
-- This migration creates the messaging system for the creative portal

-- Create creative_messages table
CREATE TABLE IF NOT EXISTS creative_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_creative_messages_sender_id ON creative_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_creative_messages_receiver_id ON creative_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_creative_messages_is_read ON creative_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_creative_messages_created_at ON creative_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creative_messages_conversation ON creative_messages(sender_id, receiver_id);

-- Enable Row Level Security
ALTER TABLE creative_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read messages they sent or received
CREATE POLICY "Users can read own messages"
  ON creative_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can insert messages they send
CREATE POLICY "Users can insert own messages"
  ON creative_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Users can update messages they sent (to mark as read if they are receiver)
CREATE POLICY "Users can update received messages"
  ON creative_messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Users can delete messages they sent
CREATE POLICY "Users can delete own messages"
  ON creative_messages FOR DELETE
  USING (auth.uid() = sender_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON creative_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON creative_messages TO service_role;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_creative_message_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER creative_messages_updated_at
  BEFORE UPDATE ON creative_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_creative_message_updated_at();

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_creative_unread_message_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unread_count
  FROM creative_messages
  WHERE receiver_id = p_user_id AND is_read = false;
  
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_creative_unread_message_count(UUID) TO authenticated;