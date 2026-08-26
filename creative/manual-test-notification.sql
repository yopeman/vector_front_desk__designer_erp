-- Manual Test Notification
-- Run this to test if the notification system can create notifications

-- First, let's check what we have
SELECT 'Checking creative_admins:' as step;
SELECT * FROM creative_admins;

SELECT 'Checking users:' as step;
SELECT id, email FROM users LIMIT 5;

-- Try to insert a test notification directly
-- This will tell us if the table structure and permissions are correct

-- Using email as user_id (fallback method)
INSERT INTO creative_notifications (
  user_id, 
  title, 
  message, 
  type, 
  category, 
  is_read
) VALUES (
  'test@example.com',  -- Use a test email
  'Manual Test Notification',
  'This is a manually inserted test notification',
  'info',
  'general',
  false
);

-- Check if it was inserted
SELECT 'Checking if notification was created:' as step;
SELECT * FROM creative_notifications 
WHERE title = 'Manual Test Notification';

-- If this works, the table is fine but the app isn't creating notifications
-- If this fails, there's a table structure or permission issue