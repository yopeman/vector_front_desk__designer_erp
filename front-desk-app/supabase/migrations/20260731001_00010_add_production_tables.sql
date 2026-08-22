-- ============================================================
-- Vector Front Desk ERP — Production Module Tables
-- Migration: 20260731_00010_add_production_tables
-- Description: Creates tables for machines, maintenance checklists, maintenance logs, and production orders
-- ============================================================

-- -----------------------------------------------------------
-- 1. machines
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS machines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    machine_type    TEXT NOT NULL,
    model           TEXT,
    serial_number   TEXT,
    location        TEXT,
    status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
    purchased_date  DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 2. machine_maintenance_checklists
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS machine_maintenance_checklists (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id          UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    checklist_type      TEXT NOT NULL CHECK (checklist_type IN ('daily', 'weekly', 'monthly')),
    checklist_name      TEXT NOT NULL,
    description         TEXT,
    checklist_items     JSONB DEFAULT '[]'::jsonb,
    estimated_duration  INTEGER,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 3. machine_maintenance_logs
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS machine_maintenance_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id        UUID NOT NULL REFERENCES machine_maintenance_checklists(id) ON DELETE CASCADE,
    machine_id          UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    performed_by        UUID REFERENCES users(id) ON DELETE SET NULL,
    performed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    checklist_results   JSONB DEFAULT '[]'::jsonb,
    notes               TEXT,
    status              TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'partial', 'skipped')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 4. production_orders
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS production_orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID REFERENCES orders(id) ON DELETE CASCADE,
    designer_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    machine_id      UUID REFERENCES machines(id) ON DELETE SET NULL,
    material        TEXT,
    thickness       TEXT,
    color           TEXT,
    length          TEXT,
    width           TEXT,
    height          TEXT,
    gram            TEXT,
    quality_status  TEXT CHECK (quality_status IN ('Pass', 'Fail', 'Pending')),
    completed_at    TIMESTAMPTZ,
    area            NUMERIC,
    task_type       TEXT CHECK (task_type IN ('project', 'task')),
    priority        TEXT DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
    status          TEXT DEFAULT 'New' CHECK (status IN ('New', 'In Progress', 'Completed', 'Cancelled')),
    job_type        TEXT CHECK (job_type IN ('received', 'rework')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- -----------------------------------------------------------
-- Indexes for performance
-- -----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_machines_machine_type ON machines(machine_type);
CREATE INDEX IF NOT EXISTS idx_machines_status ON machines(status);

CREATE INDEX IF NOT EXISTS idx_machine_maintenance_checklists_machine_id ON machine_maintenance_checklists(machine_id);
CREATE INDEX IF NOT EXISTS idx_machine_maintenance_checklists_type ON machine_maintenance_checklists(checklist_type);

CREATE INDEX IF NOT EXISTS idx_machine_maintenance_logs_checklist_id ON machine_maintenance_logs(checklist_id);
CREATE INDEX IF NOT EXISTS idx_machine_maintenance_logs_machine_id ON machine_maintenance_logs(machine_id);
CREATE INDEX IF NOT EXISTS idx_machine_maintenance_logs_performed_by ON machine_maintenance_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_machine_maintenance_logs_performed_at ON machine_maintenance_logs(performed_at DESC);

CREATE INDEX IF NOT EXISTS idx_production_orders_order_id ON production_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_designer_id ON production_orders(designer_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_machine_id ON production_orders(machine_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_status ON production_orders(status);
CREATE INDEX IF NOT EXISTS idx_production_orders_job_type ON production_orders(job_type);
CREATE INDEX IF NOT EXISTS idx_production_orders_priority ON production_orders(priority);


-- -----------------------------------------------------------
-- Grant permissions
-- -----------------------------------------------------------
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
