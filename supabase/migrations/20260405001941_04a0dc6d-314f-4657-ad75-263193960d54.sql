
-- Create user_ai_usage table for tracking daily AI usage
CREATE TABLE public.user_ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tipo_uso text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast daily queries
CREATE INDEX idx_user_ai_usage_daily ON public.user_ai_usage (user_id, tipo_uso, created_at);

-- Enable RLS
ALTER TABLE public.user_ai_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own usage" ON public.user_ai_usage
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own usage
CREATE POLICY "Users can insert own usage" ON public.user_ai_usage
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Atomic function for rate limiting in edge functions
CREATE OR REPLACE FUNCTION public.registrar_uso_ia_atomico(
  p_user_id uuid,
  p_tipo_uso text,
  p_limite_diario integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Count today's usage
  SELECT count(*) INTO v_count
  FROM public.user_ai_usage
  WHERE user_id = p_user_id
    AND tipo_uso = p_tipo_uso
    AND created_at >= (now() AT TIME ZONE 'UTC')::date;
  
  -- Check limit
  IF v_count >= p_limite_diario THEN
    RETURN false;
  END IF;
  
  -- Register usage
  INSERT INTO public.user_ai_usage (user_id, tipo_uso)
  VALUES (p_user_id, p_tipo_uso);
  
  RETURN true;
END;
$$;
