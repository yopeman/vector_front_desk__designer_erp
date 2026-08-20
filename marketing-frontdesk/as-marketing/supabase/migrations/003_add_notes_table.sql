-- ==================================================
-- NOTES TABLE
-- ==================================================
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT,
    color TEXT DEFAULT '#ffffff',
    is_pinned BOOLEAN DEFAULT false,
    checklists JSONB DEFAULT '[]'::jsonb,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for better performance
CREATE INDEX idx_notes_owner ON notes(owner_id);
CREATE INDEX idx_notes_pinned ON notes(is_pinned);
