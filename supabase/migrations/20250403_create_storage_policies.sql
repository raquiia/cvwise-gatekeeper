
-- Create storage policies for resumes bucket
-- This will ensure authenticated users can access their own files

-- First check if the bucket exists, create if it doesn't
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('resumes', 'resumes', false, 52428800, '{application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document}')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Create policies for the resumes bucket
-- Allow authenticated users to read/write their own files
BEGIN;
  -- Policy to allow users to insert their own files
  DROP POLICY IF EXISTS "Allow users to insert their own resume files" ON storage.objects;
  CREATE POLICY "Allow users to insert their own resume files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'resumes' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

  -- Policy to allow users to select their own files
  DROP POLICY IF EXISTS "Allow users to view their own resume files" ON storage.objects;
  CREATE POLICY "Allow users to view their own resume files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'resumes' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

  -- Policy to allow users to update their own files
  DROP POLICY IF EXISTS "Allow users to update their own resume files" ON storage.objects;
  CREATE POLICY "Allow users to update their own resume files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'resumes' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

  -- Policy to allow users to delete their own files
  DROP POLICY IF EXISTS "Allow users to delete their own resume files" ON storage.objects;
  CREATE POLICY "Allow users to delete their own resume files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'resumes' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );
COMMIT;
