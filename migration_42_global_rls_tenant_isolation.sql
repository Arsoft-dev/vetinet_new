-- VETINET ELITE: MIGRACIÓN 42 - AISLAMIENTO MULTI-TENANT GLOBAL
-- Esta migración asegura que absolutamente todas las tablas que contienen la columna `clinic_id`
-- estén protegidas por RLS, de forma que un usuario solo pueda leer/escribir datos de su propia clínica.

-- 1. Eliminamos políticas inseguras previas (USING (true)) conocidas de las migraciones anteriores
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados para auditorias" ON inventory_audits;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados para items de auditorias" ON inventory_audit_items;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados para kits" ON product_kits;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados para items de kits" ON product_kit_items;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados para órdenes de compra" ON purchase_orders;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados para items de órdenes de compra" ON purchase_order_items;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados para transferencias" ON inventory_transfers;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados para requisiciones" ON inventory_requisitions;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados para items de requisiciones" ON inventory_requisition_items;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados para hospital rounds" ON hospital_round_items;

-- 2. Creamos una función auxiliar segura (security definer) para obtener los clinics del usuario sin riesgo de recursión
CREATE OR REPLACE FUNCTION public.get_user_clinics()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT clinic_id FROM clinic_members WHERE user_id = auth.uid();
$$;

-- 3. Aplicamos dinámicamente la política de aislamiento a TODAS las tablas con `clinic_id`, excepto tablas críticas base y vistas
DO $$ 
DECLARE
    t_name text;
BEGIN
    FOR t_name IN 
        SELECT c.table_name 
        FROM information_schema.columns c
        JOIN information_schema.tables t ON c.table_name = t.table_name AND c.table_schema = t.table_schema
        WHERE c.column_name = 'clinic_id' 
        AND c.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND c.table_name NOT IN ('clinics', 'clinic_members', 'users') -- Excluidas para evitar bucles infinitos
    LOOP
        -- Habilitar RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t_name);
        
        -- Limpiar cualquier política global que pudiese existir con ese nombre
        EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_policy" ON %I;', t_name);
        
        -- Aplicar la política estricta de aislamiento usando la función segura
        EXECUTE format('
            CREATE POLICY "tenant_isolation_policy" ON %I
            FOR ALL
            TO authenticated
            USING (
                clinic_id IN (SELECT public.get_user_clinics())
            )
            WITH CHECK (
                clinic_id IN (SELECT public.get_user_clinics())
            );
        ', t_name);
    END LOOP;
END $$;

-- 4. Políticas específicas para tablas excluidas del bucle dinámico

-- Para `clinic_members`: un usuario puede ver los miembros de su propia clínica, o a sí mismo.
ALTER TABLE clinic_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_members_isolation_policy" ON clinic_members;
CREATE POLICY "clinic_members_isolation_policy" ON clinic_members
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR 
    clinic_id IN (SELECT public.get_user_clinics())
);

-- Para `clinics`: un usuario solo puede ver las clínicas a las que pertenece
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinics_isolation_policy" ON clinics;
CREATE POLICY "clinics_isolation_policy" ON clinics
FOR SELECT
TO authenticated
USING (
    id IN (SELECT public.get_user_clinics())
);

-- Para `users`: un usuario solo puede verse a sí mismo o a miembros de su clínica
-- (Primero limpiamos la política global si se le aplicó por error anteriormente)
DROP POLICY IF EXISTS "tenant_isolation_policy" ON users;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_isolation_policy" ON users;
CREATE POLICY "users_isolation_policy" ON users
FOR SELECT
TO authenticated
USING (
    id = auth.uid()
);

-- 5. Recargar esquema PostgREST para asegurar que las políticas se apliquen
NOTIFY pgrst, 'reload schema';
