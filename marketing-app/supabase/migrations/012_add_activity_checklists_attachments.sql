-- Add checklists and attachments to activities table
-- Create public bucket for file storage

-- Add checklists column (JSONB array of checklist items)
ALTER TABLE activities 
ADD COLUMN checklists JSONB DEFAULT '[]'::jsonb;

-- Add attachments column (JSONB array of file paths)
ALTER TABLE activities 
ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;

-- Create public bucket for activity attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('activity-attachments', 'activity-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Grant all CRUD permissions on storage.objects to authenticated users
GRANT ALL ON storage.objects TO authenticated;
