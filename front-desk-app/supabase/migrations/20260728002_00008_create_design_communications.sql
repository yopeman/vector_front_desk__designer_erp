-- ============================================================
-- Vector Front Desk ERP — Design Communications Table
-- Migration: 20260728002_00008_create_design_communications
-- Description: Creates table for communication between front desk and designers about specific designs
-- ============================================================

-- -----------------------------------------------------------
-- design_communications
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS design_communications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    design_id       UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    receiver_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    message         TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    read_at         TIMESTAMPTZ,
    attached_file_ids UUID[] DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_design_communications_design_id ON design_communications(design_id);
CREATE INDEX IF NOT EXISTS idx_design_communications_sender_id ON design_communications(sender_id);
CREATE INDEX IF NOT EXISTS idx_design_communications_created_at ON design_communications(created_at DESC);
