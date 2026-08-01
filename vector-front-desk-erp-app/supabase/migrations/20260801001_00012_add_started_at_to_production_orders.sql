-- Migration: 20260801001_00012_add_started_at_to_production_orders.sql
-- Description: Adds started_at timestamp to production_orders for status timeline tracking

ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
