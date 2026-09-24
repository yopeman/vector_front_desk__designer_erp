-- ============================================================
-- Vector Front Desk ERP — Report Captions Table
-- Migration: 20260924000000_create_report_captions
-- Description: Report caption records (e.g. saved front desk
--              reports) linked to users, with department, date
--              range, markdown note and file attachments
-- ============================================================

-- -----------------------------------------------------------
-- report_captions
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_captions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department        TEXT NOT NULL CHECK (department IN ('frontdesk', 'design', 'production', 'marketing', 'creative', 'finance')),
    from_date         DATE NOT NULL,
    to_date           DATE NOT NULL,
    note              TEXT,
    attached_file_ids UUID[] DEFAULT '{}',  -- references files.id
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (to_date >= from_date)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_report_captions_user_id     ON report_captions(user_id);
CREATE INDEX IF NOT EXISTS idx_report_captions_department  ON report_captions(department);
CREATE INDEX IF NOT EXISTS idx_report_captions_dates       ON report_captions(from_date, to_date);
CREATE INDEX IF NOT EXISTS idx_report_captions_created_at  ON report_captions(created_at DESC);

-- -----------------------------------------------------------
-- updated_at auto-update trigger
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_report_captions_updated_at ON report_captions;
CREATE TRIGGER update_report_captions_updated_at BEFORE UPDATE ON report_captions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------
-- RLS disabled + grants (matches the main front-desk schema)
-- -----------------------------------------------------------
ALTER TABLE report_captions DISABLE ROW LEVEL SECURITY;

GRANT ALL PRIVILEGES ON report_captions TO anon, authenticated;
GRANT ALL PRIVILEGES ON report_captions TO service_role;