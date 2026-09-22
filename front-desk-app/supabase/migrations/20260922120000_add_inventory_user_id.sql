-- ============================================================
-- Vector Front Desk ERP — Attach inventory items to a user
-- Migration: 20260922_120000_add_inventory_user_id
-- Description: Adds user_id to inventory so each item is owned by a specific user
-- ============================================================

-- -----------------------------------------------------------
-- 1. inventory.user_id -> users.id
-- -----------------------------------------------------------
ALTER TABLE inventory
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- -----------------------------------------------------------
-- Indexes for performance
-- -----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory(user_id);