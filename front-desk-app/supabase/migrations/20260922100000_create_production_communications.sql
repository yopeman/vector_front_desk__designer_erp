-- ============================================================
-- Vector Front Desk ERP — Production Communications Table
-- Migration: 20260922100000_create_production_communications
-- Description: Communication between machine operators, designers
--              and front desk about active (in progress) production work
-- ============================================================

-- -----------------------------------------------------------
-- production_communications
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS production_communications (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_order_id UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
    sender_id          UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    receiver_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    message            TEXT NOT NULL,
    is_read            BOOLEAN NOT NULL DEFAULT FALSE,
    read_at            TIMESTAMPTZ,
    attached_file_ids  UUID[] DEFAULT '{}',
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_production_communications_order_id ON production_communications(production_order_id);
CREATE INDEX IF NOT EXISTS idx_production_communications_sender_id ON production_communications(sender_id);
CREATE INDEX IF NOT EXISTS idx_production_communications_receiver_id ON production_communications(receiver_id);
CREATE INDEX IF NOT EXISTS idx_production_communications_created_at ON production_communications(created_at DESC);