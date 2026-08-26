-- Simple Creative Section Setup - No RLS, No Enums
-- This script creates basic tables for the creative section
-- It does NOT affect the existing HR system

-- Create creative admins table (simple role management)
CREATE TABLE IF NOT EXISTS public.creative_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create creative tables (simple structure without complex constraints)

CREATE TABLE IF NOT EXISTS public.prototype_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_date TEXT,
  request_number TEXT,
  department TEXT,
  description TEXT,
  priority TEXT,
  deadline TEXT,
  assigned_technologist TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.idea_hub (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_date TEXT,
  idea_code TEXT,
  title TEXT,
  source TEXT,
  priority TEXT,
  target_date TEXT,
  estimated_cost NUMERIC,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.design_bom (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  design_date TEXT,
  design_reference TEXT,
  project_title TEXT,
  priority TEXT,
  machine_routes TEXT[],
  bom_item TEXT,
  bom_quantity INTEGER,
  total_price NUMERIC,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.staff_leaves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_date TEXT,
  leave_id TEXT,
  employee_name TEXT,
  leave_from TEXT,
  leave_to TEXT,
  leave_type TEXT,
  justification TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender TEXT,
  recipient TEXT,
  message TEXT,
  timestamp TEXT,
  read_status BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  content TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  type TEXT,
  description TEXT,
  generated_at TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: We are NOT using RLS policies to keep it simple
-- Authentication is handled at the application level via Supabase Auth

-- ============================================
-- CREATE INITIAL CREATIVE ADMIN USER
-- ============================================
-- To create a creative admin, run this section after setting up the tables
-- Replace 'admin@yourcompany.com' with the actual admin email

-- First, create a user in Supabase Auth (this should be done via Supabase Dashboard)
-- Then add them to the creative_admins table:

-- Example: Add existing user as creative admin
-- INSERT INTO public.creative_admins (user_id, email, is_active)
-- VALUES (
--   'user-uuid-from-supabase-auth', 
--   'admin@yourcompany.com', 
--   true
-- );

-- Or if you want to add by email only (user_id will be linked later):
-- INSERT INTO public.creative_admins (email, is_active)
-- VALUES ('admin@yourcompany.com', true);

-- ============================================
-- QUERY TO CHECK CREATIVE ADMINS
-- ============================================
-- SELECT * FROM public.creative_admins WHERE is_active = true;

-- ============================================
-- QUERY TO REMOVE CREATIVE ADMIN
-- ============================================
-- DELETE FROM public.creative_admins WHERE email = 'admin@yourcompany.com';
