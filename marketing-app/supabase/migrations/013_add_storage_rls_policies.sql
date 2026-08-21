-- Add RLS policies for activity-attachments storage bucket
-- Allow authenticated users to upload, view, and delete files

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload activity attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view activity attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete activity attachments" ON storage.objects;

-- Policy to allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload activity attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'activity-attachments'
  AND auth.role() = 'authenticated'
);

-- Policy to allow authenticated users to view files
CREATE POLICY "Authenticated users can view activity attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'activity-attachments'
  AND auth.role() = 'authenticated'
);

-- Policy to allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete activity attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'activity-attachments'
  AND auth.role() = 'authenticated'
);
