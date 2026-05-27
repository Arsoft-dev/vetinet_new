-- Añadir columna de configuración de facturación a la tabla de clínicas
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS billing_enabled BOOLEAN DEFAULT true;

-- Comentario informativo
COMMENT ON COLUMN clinics.billing_enabled IS 'Indica si la clínica tiene activo el módulo de facturación y POS.';

-- Actualizar todas las clínicas existentes para que tengan facturación activa por defecto
UPDATE clinics SET billing_enabled = true WHERE billing_enabled IS NULL;
