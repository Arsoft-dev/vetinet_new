-- Migración v41: Recrear trigger de balance de stock con corrección de columna de fecha
-- Vetinet Elite

-- 1. Crear o reemplazar la función del trigger para calcular el balance antes de insertar
CREATE OR REPLACE FUNCTION trg_calculate_transaction_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_current_stock DECIMAL(12,2);
BEGIN
    -- Calcular el stock total actual del producto en el almacén (los lotes ya han sido actualizados por la acción del servidor en Next.js)
    SELECT COALESCE(SUM(quantity), 0)
    INTO v_current_stock
    FROM inventory_batches
    WHERE product_id = NEW.product_id
      AND warehouse_id = NEW.warehouse_id;

    -- Asignar stock_after (que es el stock actual después del descuento/ingreso ya aplicado)
    NEW.stock_after := v_current_stock;
    
    -- Calcular stock_before restándole el cambio de cantidad
    NEW.stock_before := v_current_stock - NEW.quantity;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Eliminar cualquier trigger antiguo sobre la tabla inventory_transactions para evitar conflictos
DROP TRIGGER IF EXISTS trg_inventory_transaction_balance ON inventory_transactions;
DROP TRIGGER IF EXISTS trg_deduct_inventory_fifo ON inventory_transactions;
DROP TRIGGER IF EXISTS deduct_inventory_fifo ON inventory_transactions;
DROP TRIGGER IF EXISTS trg_fifo ON inventory_transactions;
DROP TRIGGER IF EXISTS trg_inventory_transactions ON inventory_transactions;

-- 3. Crear el nuevo trigger sobre la tabla inventory_transactions
CREATE TRIGGER trg_inventory_transaction_balance
    BEFORE INSERT ON inventory_transactions
    FOR EACH ROW
    EXECUTE FUNCTION trg_calculate_transaction_balance();

-- 4. Recargar el esquema de PostgREST para aplicar cambios inmediatamente en Supabase
NOTIFY pgrst, 'reload schema';
