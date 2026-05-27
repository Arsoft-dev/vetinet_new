import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PurchaseOrderTemplate } from "@/components/dashboard/print/PurchaseOrderTemplate";

export default async function PrintPurchaseOrderPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    console.log("🖨️ Print Purchase Order Page Hit (Global). ID:", id);

    const supabase = await createClient();

    // Validar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return <div className="p-10 text-red-650 font-bold text-center">Acceso denegado. Inicia sesión.</div>;

    // 1. Obtener la cabecera de la orden
    const { data: orderRaw, error: orderError } = await supabase
        .from("purchase_orders")
        .select("*")
        .eq("id", id)
        .single();

    if (orderError || !orderRaw) {
        console.error("❌ Error al obtener Orden de Compra:", orderError);
        return <div className="p-10 text-red-650 font-bold text-center">Error: Orden de compra no encontrada o sin acceso.</div>;
    }

    // 2. Obtener relaciones por separado para evitar fallos de PostgREST
    // A. Ítems detallados
    const { data: items } = await supabase
        .from("purchase_order_items")
        .select(`
            *,
            product:products(name, unit, barcode)
        `)
        .eq("order_id", id);

    // B. Clínica
    const { data: clinic } = await supabase
        .from("clinics")
        .select("name, address, phone, logo_url, rif")
        .eq("id", orderRaw.clinic_id)
        .single();

    // C. Proveedor
    const { data: supplier } = await supabase
        .from("suppliers")
        .select("name, contact_person, phone, email, tax_id, address")
        .eq("id", orderRaw.supplier_id)
        .single();

    // D. Almacén
    const { data: warehouse } = await supabase
        .from("warehouses")
        .select("name")
        .eq("id", orderRaw.warehouse_id)
        .single();

    // E. Emisor
    const { data: issuer } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", orderRaw.issued_by)
        .single();

    // 3. Ensamblar objeto final orden
    const order = {
        ...orderRaw,
        items: items || [],
        clinic: clinic || null,
        supplier: supplier || null,
        warehouse: warehouse || null,
        issuer: issuer || null
    };

    // Renderizar template de impresión
    return <PurchaseOrderTemplate order={order} />;
}
