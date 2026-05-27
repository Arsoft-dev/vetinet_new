-- VETINET ELITE: MIGRACIÓN DE TRANSFERENCIAS DE INVENTARIO - DETALLE DE ITEMS (PILAR 1)
-- Este archivo define el desglose de productos y lotes que se mueven en cada transferencia interna.

-- 1. Habilitar RLS en la tabla principal de transferencias (cabecera)
ALTER TABLE inventory_transfers ENABLE ROW LEVEL SECURITY;

-- Eliminar política previa si existe para evitar conflictos al recrearla
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados para transferencias" ON inventory_transfers;

-- Crear política de RLS para la tabla principal
CREATE POLICY "Permitir todo a usuarios autenticados para transferencias"
    ON inventory_transfers
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 2. Crear tabla de items para las transferencias de inventario
CREATE TABLE IF NOT EXISTS inventory_transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL REFERENCES inventory_transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES inventory_batches(id) ON DELETE SET NULL, -- Puede ser nulo si el producto no tiene lote
    quantity DECIMAL(12,2) NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Habilitar RLS (Seguridad a Nivel de Fila) en la tabla de items
ALTER TABLE inventory_transfer_items ENABLE ROW LEVEL SECURITY;

-- Eliminar política previa de items si existe
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados para items de transferencias" ON inventory_transfer_items;

-- Crear políticas de RLS para la tabla de items
CREATE POLICY "Permitir todo a usuarios autenticados para items de transferencias"
    ON inventory_transfer_items
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 4. Recargar el esquema de PostgREST para que Supabase reconozca la nueva tabla inmediatamente
NOTIFY pgrst, 'reload schema';
