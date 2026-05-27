-- Habilitar Supabase Realtime para la tabla de anuncios del sistema
-- Esto permite que los clientes web (navegadores) escuchen los cambios en tiempo real vía WebSockets.

BEGIN;

-- Agregamos la tabla a la publicación especial "supabase_realtime"
ALTER PUBLICATION supabase_realtime ADD TABLE system_announcements;

COMMIT;
