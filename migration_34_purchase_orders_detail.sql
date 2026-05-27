-- VETINET ELITE: MIGRACIÓN ÓRDENES DE COMPRA - DETALLE DE ITEMS (PILAR 4)

-- Crear tabla de items para las órdenes de compra
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity DECIMAL(12,2) NOT NULL,
    received_quantity DECIMAL(12,2) DEFAULT 0,
    unit_price DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en purchase_order_items
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para purchase_order_items
CREATE POLICY "Permitir todo a usuarios autenticados para items de órdenes de compra"
    ON purchase_order_items
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Recargar esquema PostgREST
NOTIFY pgrst, 'reload schema';
