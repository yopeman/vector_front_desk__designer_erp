-- Migration: 20260801003_00014_add_rework_reason_to_production_orders.sql
-- Description: Adds rework_reason column to production_orders for rework job tracking

ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS rework_reason TEXT;
