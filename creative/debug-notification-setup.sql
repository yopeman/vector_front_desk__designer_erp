-- Debug Notification Setup
-- Run these queries to check the current state

-- 1. Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('creative_notifications', 'creative_messages', 'creative_admins', 'users');

-- 2. Check creative_admins table
SELECT * FROM creative_admins;

-- 3. Check users table  
SELECT id, email FROM users LIMIT 10;

-- 4. Check if there are any notifications at all
SELECT COUNT(*) as total_notifications FROM creative_notifications;

-- 5. Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('creative_notifications', 'creative_messages');

-- 6. Check table permissions
SELECT table_name, privilege_type 
FROM information_schema.table_privileges 
WHERE table_name IN ('creative_notifications', 'creative_messages')
AND grantee = 'authenticated';