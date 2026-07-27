-- Disable RLS on storage.objects, ignoring permission errors
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'storage' AND tablename = 'objects'
  ) THEN
    BEGIN
      EXECUTE 'ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY';
    EXCEPTION 
      WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skipping: insufficient privilege to disable RLS on storage.objects';
      WHEN undefined_table THEN
        RAISE NOTICE 'Skipping: table storage.objects does not exist';
    END;
  END IF;
END $$;

-- Disable RLS on files table
ALTER TABLE files DISABLE ROW LEVEL SECURITY;

-- Create storage policy to allow all operations on documents bucket
DROP POLICY IF EXISTS "Public Access Documents" ON storage.objects;
CREATE POLICY "Public Access Documents" ON storage.objects
FOR ALL
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');