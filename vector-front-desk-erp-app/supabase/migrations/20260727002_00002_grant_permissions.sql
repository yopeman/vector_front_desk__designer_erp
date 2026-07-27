-- ============================================================
-- Grant table permissions to anon and authenticated roles
-- No RLS — this simply allows the API to read/write all tables
-- ============================================================

-- Grant all privileges on all tables in the public schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Ensure future tables also get granted (but we already have all tables)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated;