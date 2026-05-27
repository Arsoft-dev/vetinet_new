-- Eliminar la política defectuosa que causa recursión infinita
DROP POLICY IF EXISTS "tenant_isolation_clinic_members" ON "public"."clinic_members";

-- Crear la política corregida
-- Un usuario siempre tiene permiso absoluto para ver su PROPIO registro de membresía.
-- Como todos los listados de "Staff" en Vetinet se hacen con supabaseAdmin (Service Role),
-- esta política es perfecta para evitar la recursión y mantener la seguridad al máximo.
CREATE POLICY "tenant_isolation_clinic_members" ON "public"."clinic_members" 
AS PERMISSIVE FOR ALL TO public
USING (
    user_id = auth.uid()
);
