-- CORRECCIÓN PARA LA TABLA DE ALMACENES (WAREHOUSES)
-- Agrega las columnas faltantes en caso de que la tabla ya existiera previamente.

ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'storage' CHECK (type IN ('storage', 'point_of_sale', 'consulting', 'quarantine'));

-- Actualizar registros existentes para asegurar que tengan valores por defecto válidos
UPDATE warehouses SET is_active = true WHERE is_active IS NULL;
UPDATE warehouses SET type = 'storage' WHERE type IS NULL;
