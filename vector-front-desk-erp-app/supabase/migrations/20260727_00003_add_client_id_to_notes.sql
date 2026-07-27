-- ============================================================
-- Add client_id reference to notes table for client/lead notes
-- ============================================================

ALTER TABLE notes ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notes_client_id ON notes(client_id);