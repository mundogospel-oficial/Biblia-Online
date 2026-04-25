-- Create a security definer function for marking messages as read
CREATE OR REPLACE FUNCTION public.mark_message_read(msg_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE messages SET read = true WHERE id = msg_id AND receiver_id = auth.uid();
$$;

-- Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.messages;

-- Create a restrictive UPDATE policy that only allows setting read=true
CREATE POLICY "Users can mark messages as read" ON public.messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id AND read = true);