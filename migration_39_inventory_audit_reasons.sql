-- VETINET ELITE: MIGRACIÓN DE AUDITORÍAS - MOTIVOS DE DISCREPANCIA (PILAR 6)
-- Este archivo añade la columna para clasificar las causas raíces de las discrepancias en auditorías físicas.

-- 1. Añadir la columna discrepancy_reason con restricción de check
ALTER TABLE inventory_audit_items 
ADD COLUMN IF NOT EXISTS discrepancy_reason TEXT 
CONSTRAINT discrepancy_reason_check CHECK (discrepancy_reason IN ('counting_error', 'clinical_omission', 'damaged_expired', 'unexplained_loss', 'unexplained_surplus'));

-- 2. Recargar el esquema de PostgREST para Supabase
NOTIFY pgrst, 'reload schema';
