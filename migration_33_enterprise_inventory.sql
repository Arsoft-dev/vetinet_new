-- VETINET ELITE: MIGRACIÓN INVENTARIO ENTERPRISE (PILARES 1-7)

-- 1. ALMACENES (PILAR 1)
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'storage' CHECK (type IN ('storage', 'point_of_sale', 'consulting', 'quarantine')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PROVEEDORES (PILAR 4)
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    tax_id TEXT, -- RIF o ID Fiscal
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ÓRDENES DE COMPRA (PILAR 4)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    order_number TEXT UNIQUE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'received', 'canceled')),
    total_amount_usd DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    issued_by UUID REFERENCES users(id),
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. KITS / COMBOS (PILAR 5)
CREATE TABLE IF NOT EXISTS product_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    sale_price DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_kit_items (
    kit_id UUID REFERENCES product_kits(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity DECIMAL(12,2) NOT NULL,
    PRIMARY KEY (kit_id, product_id)
);

-- 5. AUDITORÍAS / TOMAS FÍSICAS (PILAR 6)
CREATE TABLE IF NOT EXISTS inventory_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'canceled')),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_audit_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID REFERENCES inventory_audits(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES inventory_batches(id),
    expected_quantity DECIMAL(12,2) NOT NULL,
    actual_quantity DECIMAL(12,2) NOT NULL,
    discrepancy DECIMAL(12,2) GENERATED ALWAYS AS (actual_quantity - expected_quantity) STORED
);

-- 6. TRANSFERENCIAS ENTRE ALMACENES (PILAR 1)
CREATE TABLE IF NOT EXISTS inventory_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    from_warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
    to_warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'shipped', 'completed', 'canceled')),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. ACTUALIZACIONES EN TABLAS EXISTENTES
-- Asegurar que las transacciones tienen responsable y almacén
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory_transactions' AND column_name='created_by') THEN
        ALTER TABLE inventory_transactions ADD COLUMN created_by UUID REFERENCES users(id);
    END IF;
END $$;

ALTER TABLE inventory_batches ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id);
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT; -- PILAR 7

-- 8. VISTA DE KARDEX DETALLADO (PILAR 2)
-- Esta vista facilita ver el historial profesional
CREATE OR REPLACE VIEW view_inventory_kardex AS
SELECT 
    it.id,
    it.clinic_id,
    it.product_id,
    it.created_at,
    p.name as product_name,
    it.transaction_type,
    it.quantity as quantity_change,
    it.stock_before,
    it.stock_after,
    it.notes as reason,
    u.full_name as responsible_user,
    w.name as warehouse_name
FROM inventory_transactions it
JOIN products p ON it.product_id = p.id
LEFT JOIN users u ON it.created_by = u.id
LEFT JOIN warehouses w ON it.warehouse_id = w.id;

-- 9. LOGICA DE AUTOCONSUMO / AJUSTES
-- Agregamos un CHECK mas robusto para los tipos de transaccion
-- Tipos: purchase, sale, adjustment, return, expiration, consumption (Autoconsumo), transfer
ALTER TABLE inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_transaction_type_check;
ALTER TABLE inventory_transactions ADD CONSTRAINT inventory_transactions_transaction_type_check 
CHECK (transaction_type IN ('purchase', 'sale', 'adjustment', 'return', 'expiration', 'consumption', 'transfer'));
