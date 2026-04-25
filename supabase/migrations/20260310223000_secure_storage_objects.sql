-- Garante que a segurança a nível de linha (RLS) está ativa nos arquivos
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Remove a regra antiga caso ela exista para não dar conflito
DROP POLICY IF EXISTS "Permitir apenas arquivos seguros no bucket mídia" ON storage.objects;

-- Cria a regra blindada: Só aceita imagens, vídeos, áudios e PDFs.
CREATE POLICY "Permitir apenas arquivos seguros no bucket mídia"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'mídia' 
    AND (
        mimetype LIKE 'image/%' 
        OR mimetype LIKE 'video/%' 
        OR mimetype LIKE 'audio/%'
        OR mimetype = 'application/pdf'
    )
);

-- Faz o mesmo para o bucket 'media' (em inglês) por segurança
DROP POLICY IF EXISTS "Permitir apenas arquivos seguros no bucket media" ON storage.objects;

CREATE POLICY "Permitir apenas arquivos seguros no bucket media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'media' 
    AND (
        mimetype LIKE 'image/%' 
        OR mimetype LIKE 'video/%' 
        OR mimetype LIKE 'audio/%'
        OR mimetype = 'application/pdf'
    )
);
