-- Migration: 20260921085914_add_job_order_id_to_production_orders.sql
-- Description: Adds job_order_id column to production_orders for linking production orders to job orders

ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS job_order_id UUID REFERENCES job_orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_production_orders_job_order_id ON production_orders(job_order_id);