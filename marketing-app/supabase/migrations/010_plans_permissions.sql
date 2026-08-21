-- ==================================================
-- DISABLE RLS AND GRANT PERMISSIONS FOR PLANS TABLE
-- ==================================================

-- Disable RLS on plans table
ALTER TABLE plans DISABLE ROW LEVEL SECURITY;

-- Grant SELECT, INSERT, UPDATE, DELETE permissions on plans table to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON plans TO authenticated;
