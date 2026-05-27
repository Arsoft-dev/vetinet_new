import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { InventoryAuditTemplate } from "@/components/dashboard/print/InventoryAuditTemplate";

export default async function PrintInventoryAuditPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    console.log("🖨️ Print Inventory Audit Page Hit. ID:", id);

    const supabase = await createClient();

    // Validar sesión del usuario clínico
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return <div className="p-10 text-red-650 font-bold text-center">Acceso denegado. Inicia sesión.</div>;

    // 1. Obtener cabecera de la auditoría
    const { data: auditRaw, error: auditError } = await supabase
        .from("inventory_audits")
        .select("*")
        .eq("id", id)
        .single();

    if (auditError || !auditRaw) {
        console.error("❌ Error al obtener Auditoría de Stock:", auditError);
        return <div className="p-10 text-red-650 font-bold text-center">Error: Auditoría de inventario no encontrada o sin acceso.</div>;
    }

    // 2. Obtener relaciones necesarias por separado para evitar problemas de caché de PostgREST
    // A. Ítems detallados con precio
    const { data: items } = await supabase
        .from("inventory_audit_items")
        .select(`
            *,
            product:products(name, unit, barcode, sale_price),
            batch:inventory_batches(batch_number, expiry_date)
        `)
        .eq("audit_id", id);

    // B. Clínica
    const { data: clinic } = await supabase
        .from("clinics")
        .select("name, address, phone, logo_url, rif")
        .eq("id", auditRaw.clinic_id)
        .single();

    // C. Almacén
    const { data: warehouse } = await supabase
        .from("warehouses")
        .select("name, type")
        .eq("id", auditRaw.warehouse_id)
        .single();

    // D. Responsable (Creador)
    const { data: creator } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", auditRaw.created_by)
        .single();

    // Calcular diagnóstico inteligente basado en el Kardex de los últimos 7 días
    const productIds = (items || []).map((item: any) => item.product_id);
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - 7);

    let recentTrans: any[] = [];
    if (productIds.length > 0) {
        const { data } = await supabase
            .from("inventory_transactions")
            .select("product_id, transaction_type, created_at")
            .eq("warehouse_id", auditRaw.warehouse_id)
            .in("product_id", productIds)
            .gte("created_at", dateLimit.toISOString());
        recentTrans = data || [];
    }

    const itemsWithDiagnostics = (items || []).map((item: any) => {
        const itemTrans = recentTrans.filter(t => t.product_id === item.product_id);
        
        let pista = "Sin movimientos registrados en los últimos 7 días. Posible pérdida física o merma.";
        
        if (itemTrans.length > 0) {
            const types = itemTrans.map(t => t.transaction_type);
            if (types.includes("purchase")) {
                pista = "Compra reciente registrada en los últimos 7 días. Verificar si coincidieron las cajas del proveedor.";
            } else if (types.includes("transfer")) {
                pista = "Traslado de stock reciente en este almacén. Verificar si hay mercancía en tránsito.";
            } else if (types.includes("sale")) {
                pista = "Ventas o consumos clínicos activos recientemente. Posible omisión de registro en sistema.";
            } else if (types.includes("adjustment")) {
                pista = "Ajuste manual de inventario reciente. Verificar coherencia de registros anteriores.";
            } else {
                pista = "Actividad operativa reciente detectada en el Kardex. Revisar último arqueo.";
            }
        }
        
        return {
            ...item,
            suggested_pista: pista
        };
    });

    // 3. Ensamblar objeto consolidado
    const audit = {
        ...auditRaw,
        items: itemsWithDiagnostics,
        clinic: clinic || null,
        warehouse: warehouse || null,
        user: creator || null
    };

    // Renderizar plantilla de impresión comercial
    return <InventoryAuditTemplate audit={audit} />;
}
