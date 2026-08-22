-- ============================================================
-- Vector Front Desk ERP — Alter Deliveries Items Column
-- Migration: 20260728_00001_alter_deliveries_items_to_text
-- Description: Change items column from JSONB to TEXT in deliveries table
-- ============================================================

-- Alter the items column from JSONB to TEXT
ALTER TABLE deliveries 
ALTER COLUMN items TYPE TEXT USING items::TEXT;

-- Also change items_installed in installations table to TEXT for consistency
ALTER TABLE installations 
ALTER COLUMN items_installed TYPE TEXT USING items_installed::TEXT;
