-- ==================================================
-- BACKFILL PROFILES TABLE WITH EXISTING USERS
-- ==================================================
INSERT INTO profiles (id, email)
SELECT id, email 
FROM auth.users 
WHERE id NOT IN (SELECT id FROM profiles);
