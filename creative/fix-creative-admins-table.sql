-- ============================================
-- FIX CREATIVE ADMINS TABLE
-- ============================================
-- This script fixes the creative_admins table by removing the user_id requirement
-- Run this if you got the "null value in column user_id" error

-- Step 1: Drop the existing table (this will delete any existing data)
DROP TABLE IF EXISTS public.creative_admins;

-- Step 2: Recreate the table without user_id requirement
CREATE TABLE public.creative_admins (
  id UUID 
  DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Add your admin email (replace with your actual email)
INSERT INTO public.creative_admins (email, is_active)
VALUES ('your-admin-email@company.com', true);

-- Verify the fix
SELECT * FROM public.creative_admins;