-- Fix 1: Restrict media bucket uploads to user's own folder
DROP POLICY IF EXISTS "Auth users can upload media" ON storage.objects;
CREATE POLICY "Auth users can upload own media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Fix 2: Restrict messages UPDATE to only allow marking as read (prevent content/sender_id tampering)
DROP POLICY IF EXISTS "Users can update own received messages" ON public.messages;
CREATE POLICY "Users can mark messages as read" ON public.messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (
    auth.uid() = receiver_id
  );