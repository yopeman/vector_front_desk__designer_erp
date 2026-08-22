-- ============================================================
-- Vector Front Desk ERP — Production Orders Attachments and Note
-- Migration: 20260812_add_production_orders_attachments_note
-- Description: Adds attached_file_ids and note columns to production_orders table
-- ============================================================

-- -----------------------------------------------------------
-- Add columns to production_orders table
-- -----------------------------------------------------------
ALTER TABLE production_orders
    ADD COLUMN attached_file_ids UUID[] DEFAULT '{}',
    ADD COLUMN note TEXT;
