-- VETINET ELITE: MIGRACIÓN DE AUDITORÍAS - POLÍTICAS RLS (PILAR 6)
-- Este archivo habilita la seguridad RLS y define políticas de acceso para gestionar las auditorías de stock.

-- 1. Habilitar RLS y políticas para inventory_audits (Cabecera)
ALTER TABLE inventory_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados para auditorias" ON inventory_audits;

CREATE POLICY "Permitir todo a usuarios autenticados para auditorias"
    ON inventory_audits
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 2. Habilitar RLS y políticas para inventory_audit_items (Detalle de Conteos)
ALTER TABLE inventory_audit_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados para items de auditorias" ON inventory_audit_items;

CREATE POLICY "Permitir todo a usuarios autenticados para items de auditorias"
    ON inventory_audit_items
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 3. Recargar el esquema de PostgREST
NOTIFY pgrst, 'reload schema';
