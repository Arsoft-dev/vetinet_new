-- VETINET ELITE: MIGRACIÓN DE KITS Y COMBOS - POLÍTICAS RLS (PILAR 5)
-- Este archivo habilita la seguridad RLS y define políticas de acceso para gestionar los kits y combos de la clínica.

-- 1. Habilitar RLS y políticas para product_kits (Cabecera)
ALTER TABLE product_kits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados para kits" ON product_kits;

CREATE POLICY "Permitir todo a usuarios autenticados para kits"
    ON product_kits
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 2. Habilitar RLS y políticas para product_kit_items (Detalle de Componentes)
ALTER TABLE product_kit_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados para items de kits" ON product_kit_items;

CREATE POLICY "Permitir todo a usuarios autenticados para items de kits"
    ON product_kit_items
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 3. Recargar el esquema de PostgREST
NOTIFY pgrst, 'reload schema';
