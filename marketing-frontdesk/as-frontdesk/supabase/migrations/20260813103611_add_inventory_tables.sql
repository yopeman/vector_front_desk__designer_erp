-- ============================================================
-- Vector Front Desk ERP — Inventory Management Tables
-- Migration: 20260731_00011_add_inventory_tables
-- Description: Creates tables for inventory stock management and stock movements
-- ============================================================

-- -----------------------------------------------------------
-- 1. inventory (Stock Master)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_code           TEXT UNIQUE,
    name                TEXT NOT NULL,
    category            TEXT,
    description         TEXT,
    unit_of_measure     TEXT,
    current_quantity    NUMERIC DEFAULT 0,
    minimum_stock       NUMERIC DEFAULT 0,
    location            TEXT,
    status              TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 2. inventory_movements (Stock Transactions)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_movements (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id        UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    movement_type       TEXT NOT NULL CHECK (movement_type IN ('in', 'out')),
    quantity            NUMERIC NOT NULL,
    reference_type      TEXT,
    reference_id        UUID,
    machine_id          UUID REFERENCES machines(id) ON DELETE SET NULL,
    production_order_id UUID REFERENCES production_orders(id) ON DELETE SET NULL,
    performed_by        UUID REFERENCES users(id) ON DELETE SET NULL,
    notes               TEXT,
    movement_date       TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- Indexes for performance
-- -----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_inventory_item_code ON inventory(item_code);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_inventory_id ON inventory_movements(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_movement_type ON inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_movement_date ON inventory_movements(movement_date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_production_order_id ON inventory_movements(production_order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_machine_id ON inventory_movements(machine_id);

-- -----------------------------------------------------------
-- Grant permissions
-- -----------------------------------------------------------
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
