-- ==================================================
-- DISABLE RLS AND GRANT PERMISSIONS FOR NOTIFICATIONS TABLE
-- ==================================================

-- Disable RLS on notifications table
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Grant SELECT, INSERT, UPDATE, DELETE permissions on notifications table to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
