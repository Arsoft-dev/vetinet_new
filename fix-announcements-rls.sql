-- Permitir que todos los usuarios autenticados puedan leer los anuncios del sistema
-- Esto es fundamental para que Supabase Realtime les envíe los eventos por WebSockets.

CREATE POLICY "Permitir lectura de anuncios a todos" ON "public"."system_announcements"
AS PERMISSIVE FOR SELECT TO public
USING (true);
