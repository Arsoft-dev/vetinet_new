-- SCRIPT MAESTRO DE BLINDAJE MULTI-TENANT (RLS)
-- Ejecuta esto en el SQL Editor de Supabase

-- 🔒 Blindando tabla: payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_payments" ON public.payments;
CREATE POLICY "tenant_isolation_payments"
ON public.payments
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()
  )
);

-- 🔒 Blindando tabla: view_inventory_kardex
ALTER TABLE public.view_inventory_kardex ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_view_inventory_kardex" ON public.view_inventory_kardex;
CREATE POLICY "tenant_isolation_view_inventory_kardex"
ON public.view_inventory_kardex
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()
  )
);

-- 🔒 Blindando tabla: inventory_audits
ALTER TABLE public.inventory_audits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_inventory_audits" ON public.inventory_audits;
CREATE POLICY "tenant_isolation_inventory_audits"
ON public.inventory_audits
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()
  )
);

-- 🔒 Blindando tabla: inventory_transfers
ALTER TABLE public.inventory_transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_inventory_transfers" ON public.inventory_transfers;
CREATE POLICY "tenant_isolation_inventory_transfers"
ON public.inventory_transfers
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()
  )
);

-- 🔒 Blindando tabla: clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_clients" ON public.clients;
CREATE POLICY "tenant_isolation_clients"
ON public.clients
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()
  )
);

-- 🔒 Blindando tabla: exchange_rates
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_exchange_rates" ON public.exchange_rates;
CREATE POLICY "tenant_isolation_exchange_rates"
ON public.exchange_rates
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()
  )
);

-- 🔒 Blindando tabla: inventory_movements
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_inventory_movements" ON public.inventory_movements;
CREATE POLICY "tenant_isolation_inventory_movements"
ON public.inventory_movements
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()
  )
);

-- 🔒 Blindando tabla: appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_appointments" ON public.appointments;
CREATE POLICY "tenant_isolation_appointments"
ON public.appointments
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()
  )
);

-- 🔒 Blindando tabla: inventory_requisitions
ALTER TABLE public.inventory_requisitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_inventory_requisitions" ON public.inventory_requisitions;
CREATE POLICY "tenant_isolation_inventory_requisitions"
ON public.inventory_requisitions
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()
  )
);

-- 🔒 Blindando tabla: medical_records
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_medical_records" ON public.medical_records;
CREATE POLICY "tenant_isolation_medical_records"
ON public.medical_records
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()
  )
);

-- 🔒 Blindando tabla: products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_products" ON public.products;
CREATE POLICY "tenant_isolation_products"
ON public.products
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()
  )
);

-- 🔒 Blindando tabla: suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_suppliers" ON public.suppliers;
CREATE POLICY "tenant_isolation_suppliers"
ON public.suppliers
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()
  )
);

-- 🔒 Blindando tabla: inventory_transactions
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_inventory_transactions" ON public.inventory_transactions;
CREATE POLICY "tenant_isolation_inventory_transactions"
ON public.inventory_transactions
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()
  )
);

-- 🔒 Blindando tabla: warehouses
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_warehouses" ON public.warehouses;
CREATE POLICY "tenant_isolation_warehouses"
ON public.warehouses
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()
  )
);

-- 🔒 Blindando tabla: clinic_members
ALTER TABLE public.clinic_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_clinic_members" ON public.clinic_members;
CREATE POLICY "tenant_isolation_clinic_members"
ON public.clinic_members
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()
  )
);

-- 🔒 Blindando tabla: treatment_protocols
ALTER TABLE public.treatment_protocols ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_treatment_protocols" ON public.treatment_protocols;
CREATE POLICY "tenant_isolation_treatment_protocols"
ON public.treatment_protocols
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()
  )
);

-- 🔒 Blindando tabla: invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_invoices" ON public.invoices;
CREATE POLICY "tenant_isolation_invoices"
ON public.invoices
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()
  )
);

-- 🔒 Blindando tabla: consultation_items
ALTER TABLE public.consultation_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_consultation_items" ON public.consultation_items;
CREATE POLICY "tenant_isolation_consultation_items"
ON public.consultation_items
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()
  )
);

-- 🔒 Blindando tabla: product_kits
ALTER TABLE public.product_kits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_product_kits" ON public.product_kits;
CREATE POLICY "tenant_isolation_product_kits"
ON public.product_kits
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()
  )
);

-- 🔒 Blindando tabla: cash_registers
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_cash_registers" ON public.cash_registers;
CREATE POLICY "tenant_isolation_cash_registers"
ON public.cash_registers
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()
  )
);

-- 🔒 Blindando tabla: hospitalizations
ALTER TABLE public.hospitalizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_hospitalizations" ON public.hospitalizations;
CREATE POLICY "tenant_isolation_hospitalizations"
ON public.hospitalizations
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()
  )
);

-- 🔒 Blindando tabla: exam_orders
ALTER TABLE public.exam_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_exam_orders" ON public.exam_orders;
CREATE POLICY "tenant_isolation_exam_orders"
ON public.exam_orders
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()
  )
);

-- 🔒 Blindando tabla: hospital_round_items
ALTER TABLE public.hospital_round_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_hospital_round_items" ON public.hospital_round_items;
CREATE POLICY "tenant_isolation_hospital_round_items"
ON public.hospital_round_items
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()
  )
);

-- 🔒 Blindando tabla: vaccinations
ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_vaccinations" ON public.vaccinations;
CREATE POLICY "tenant_isolation_vaccinations"
ON public.vaccinations
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()
  )
);

-- 🔒 Blindando tabla: pets
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_pets" ON public.pets;
CREATE POLICY "tenant_isolation_pets"
ON public.pets
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()
  )
);

-- 🔒 Blindando tabla: purchase_orders
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_purchase_orders" ON public.purchase_orders;
CREATE POLICY "tenant_isolation_purchase_orders"
ON public.purchase_orders
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()
  )
);

-- 🔒 Blindando tabla: audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_audit_logs" ON public.audit_logs;
CREATE POLICY "tenant_isolation_audit_logs"
ON public.audit_logs
FOR ALL
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()
  )
);

