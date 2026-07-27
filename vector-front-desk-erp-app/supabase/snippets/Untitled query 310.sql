
-- Create storage policy to allow all operations on documents bucket
DROP POLICY IF EXISTS "Public Access Documents" ON storage.objects;
CREATE POLICY "Public Access Documents" ON storage.objects
FOR ALL
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');