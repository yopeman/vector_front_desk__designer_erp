-- ============================================
-- ADD CREATIVE ADMIN USER
-- ============================================
-- This script helps you add a user as a creative admin
-- Run this in Supabase SQL Editor

-- Simple: Add by email only
INSERT INTO public.creative_admins (email, is_active)
VALUES ('admin-email@yourcompany.com', true)
ON CONFLICT (email) DO UPDATE SET 
  is_active = true;

-- ============================================
-- USEFUL QUERIES
-- ============================================

-- Check all creative admins
SELECT * FROM public.creative_admins WHERE is_active = true;

-- Remove a user from creative admin
DELETE FROM public.creative_admins WHERE email = 'admin-email@yourcompany.com';

-- Deactivate a creative admin (soft delete)
UPDATE public.creative_admins SET is_active = false WHERE email = 'admin-email@yourcompany.com';
