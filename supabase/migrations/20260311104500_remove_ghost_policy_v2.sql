-- Remove a política fantasma e permissiva que o scanner encontrou
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de suas próprias mídias v2" ON storage.objects;
