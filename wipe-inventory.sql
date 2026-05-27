-- ¡ADVERTENCIA! Este script eliminará TODOS los datos de inventario
DELETE FROM public.inventory_requisition_items;
DELETE FROM public.inventory_requisitions;
DELETE FROM public.hospital_round_items;
DELETE FROM public.product_kit_items;
DELETE FROM public.product_kits;
DELETE FROM public.inventory_transactions;
DELETE FROM public.inventory_audit_items;
DELETE FROM public.inventory_audits;
DELETE FROM public.inventory_transfers;
DELETE FROM public.purchase_orders;
DELETE FROM public.inventory_batches;
DELETE FROM public.products;
DELETE FROM public.suppliers;
DELETE FROM public.warehouses;
