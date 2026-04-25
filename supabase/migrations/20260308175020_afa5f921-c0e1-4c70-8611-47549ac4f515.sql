-- Drop duplicate storage INSERT policy (keep only v2)
DROP POLICY IF EXISTS "Auth users can upload own media" ON storage.objects;

-- Drop the overly permissive messages UPDATE policy; use mark_message_read RPC instead
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.messages;