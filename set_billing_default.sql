-- Cambiar el valor por defecto de facturación a falso para nuevas clínicas
ALTER TABLE clinics ALTER COLUMN billing_enabled SET DEFAULT false;

-- Opcional: Si quieres apagarle la facturación a todas las clínicas actuales (excepto la tuya)
-- UPDATE clinics SET billing_enabled = false WHERE name != 'Tu Clínica Principal';
