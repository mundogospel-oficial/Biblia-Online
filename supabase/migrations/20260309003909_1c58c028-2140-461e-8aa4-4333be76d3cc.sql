-- Add missing DELETE policy for media bucket (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Auth users can delete own media'
  ) THEN
    EXECUTE 'CREATE POLICY "Auth users can delete own media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = ''media'' AND (storage.foldername(name))[1] = auth.uid()::text)';
  END IF;
END $$;