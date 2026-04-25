-- 1. FAXINA: Removemos todas as nossas tentativas anteriores para evitar a regra do "OR"
DROP POLICY IF EXISTS "Permitir apenas arquivos seguros no bucket mídia" ON storage.objects;
DROP POLICY IF EXISTS "Permitir apenas arquivos seguros no bucket media" ON storage.objects;

-- Removemos também possíveis políticas genéricas que o próprio sistema/Lovable possa ter criado antes
DROP POLICY IF EXISTS "Users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder in media" ON storage.objects;

-- 2. A POLÍTICA SUPREMA E DEFINITIVA
CREATE POLICY "Upload blindado e isolado por usuario"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    -- Só aceita nos buckets de mídia
    bucket_id IN ('mídia', 'media') 
    
    -- A MÁGICA AQUI: O usuário é OBRIGADO a salvar o arquivo dentro de uma pasta com o ID dele
    AND (storage.foldername(name))[1] = auth.uid()::text 
    
    -- Só aceita arquivos seguros
    AND (
        mimetype LIKE 'image/%' 
        OR mimetype LIKE 'video/%' 
        OR mimetype LIKE 'audio/%'
        OR mimetype = 'application/pdf'
    )
);
