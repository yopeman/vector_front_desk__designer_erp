-- ==================================================
-- DISABLE RLS ON ALL TABLES AND GRANT PERMISSIONS
-- ==================================================

-- Disable RLS on all tables
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_targets DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE proposals DISABLE ROW LEVEL SECURITY;
ALTER TABLE proformas DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenders DISABLE ROW LEVEL SECURITY;
ALTER TABLE products_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE market_insights DISABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE proforma_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Grant SELECT, INSERT, UPDATE, DELETE permissions on all tables to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON campaign_targets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON proposals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON proformas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tenders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON products_services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON market_insights TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON proposal_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON proforma_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON conversation_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;

-- Grant USAGE on sequences to authenticated role (for auto-incrementing IDs if needed)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
