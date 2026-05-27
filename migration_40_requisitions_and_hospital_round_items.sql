-- Migración v40: Requisiciones de Inventario Internas e Ítems de Rondas de Hospitalización
-- Vetinet Elite

-- 1. Tabla de Requisiciones (Cabecera)
CREATE TABLE IF NOT EXISTS inventory_requisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    requester_id UUID NOT NULL,
    destination_warehouse_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT fk_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    CONSTRAINT fk_requester FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_warehouse FOREIGN KEY (destination_warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
);

-- 2. Tabla de Requisiciones (Detalle)
CREATE TABLE IF NOT EXISTS inventory_requisition_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requisition_id UUID NOT NULL,
    product_id UUID NOT NULL,
    requested_quantity NUMERIC NOT NULL CHECK (requested_quantity > 0),
    CONSTRAINT fk_requisition FOREIGN KEY (requisition_id) REFERENCES inventory_requisitions(id) ON DELETE CASCADE,
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 3. Tabla de Insumos Consumidos en Rondas de Hospitalización
CREATE TABLE IF NOT EXISTS hospital_round_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    hospitalization_id UUID NOT NULL,
    round_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC NOT NULL DEFAULT 0,
    total_price NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT fk_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    CONSTRAINT fk_hospitalization FOREIGN KEY (hospitalization_id) REFERENCES hospitalizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_round FOREIGN KEY (round_id) REFERENCES hospital_rounds(id) ON DELETE CASCADE,
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Habilitar RLS en todas las tablas
ALTER TABLE inventory_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_requisition_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_round_items ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Seguridad RLS

-- inventory_requisitions:
CREATE POLICY "Allow all actions for clinic users on requisitions"
    ON inventory_requisitions
    FOR ALL
    TO authenticated
    USING (clinic_id IN (
        SELECT clinic_id FROM clinic_members WHERE user_id = auth.uid()
    ))
    WITH CHECK (clinic_id IN (
        SELECT clinic_id FROM clinic_members WHERE user_id = auth.uid()
    ));

-- inventory_requisition_items:
CREATE POLICY "Allow all actions for clinic users on requisition items"
    ON inventory_requisition_items
    FOR ALL
    TO authenticated
    USING (requisition_id IN (
        SELECT id FROM inventory_requisitions WHERE clinic_id IN (
            SELECT clinic_id FROM clinic_members WHERE user_id = auth.uid()
        )
    ))
    WITH CHECK (requisition_id IN (
        SELECT id FROM inventory_requisitions WHERE clinic_id IN (
            SELECT clinic_id FROM clinic_members WHERE user_id = auth.uid()
        )
    ));

-- hospital_round_items:
CREATE POLICY "Allow all actions for clinic users on hospital round items"
    ON hospital_round_items
    FOR ALL
    TO authenticated
    USING (clinic_id IN (
        SELECT clinic_id FROM clinic_members WHERE user_id = auth.uid()
    ))
    WITH CHECK (clinic_id IN (
        SELECT clinic_id FROM clinic_members WHERE user_id = auth.uid()
    ));
