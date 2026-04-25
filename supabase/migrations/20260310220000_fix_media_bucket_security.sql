-- 1. Protege o bucket chamado 'mídia' (citado no alerta de segurança)
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'mídia', 
  'mídia', 
  true, 
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'audio/mpeg', 'audio/ogg'], 
  5242880 -- Limite de 5MB
)
ON CONFLICT (id) DO UPDATE 
SET 
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  file_size_limit = EXCLUDED.file_size_limit;

-- 2. Protege o bucket chamado 'media' (padrão do sistema, por precaução)
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'media', 
  'media', 
  true, 
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'audio/mpeg', 'audio/ogg'], 
  5242880 -- Limite de 5MB
)
ON CONFLICT (id) DO UPDATE 
SET 
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  file_size_limit = EXCLUDED.file_size_limit;
