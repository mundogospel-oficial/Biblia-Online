-- Fix unrestricted storage policies
DROP POLICY IF EXISTS "Auth users can upload to media" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can update own media" ON storage.objects;

CREATE POLICY "Auth users can upload own media v2" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Auth users can update own media v2" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);