"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Helper para obtener el ID de la clínica del usuario actual
async function getClinicId(supabase: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: member } = await supabase
        .from("clinic_members")
        .select("clinic_id")
        .eq("user_id", user.id)
        .single();

    return member ? member.clinic_id : null;
}

// Obtener listado de auditorías realizadas
export async function getInventoryAudits() {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);

    if (!clinicId) return [];

    const { data, error } = await supabase
        .from("inventory_audits")
        .select(`
            *,
            warehouse:warehouses(name),
            user:users!created_by(full_name),
            items:inventory_audit_items(count)
        `)
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error al obtener auditorías de inventario:", error);
        return [];
    }

    // Adaptar conteo de items
    return (data || []).map(aud => ({
        ...aud,
        items_count: aud.items?.[0]?.count || 0
    }));
}

// Obtener una auditoría detallada por ID con discrepancias calculadas
export async function getInventoryAuditById(id: string) {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);

    if (!clinicId) return null;

    // Obtener cabecera
    const { data: audit, error: auditError } = await supabase
        .from("inventory_audits")
        .select(`
            *,
            warehouse:warehouses(name),
            user:users!created_by(full_name)
        `)
        .eq("id", id)
        .eq("clinic_id", clinicId)
        .single();

    if (auditError || !audit) {
        console.error("Error al obtener cabecera de auditoría:", auditError);
        return null;
    }

    // Obtener ítems detallados con precio de venta
    const { data: items, error: itemsError } = await supabase
        .from("inventory_audit_items")
        .select(`
            *,
            product:products(name, unit, barcode, sale_price),
            batch:inventory_batches(batch_number, expiry_date)
        `)
        .eq("audit_id", id);

    if (itemsError) {
        console.error("Error al obtener ítems de la auditoría:", itemsError);
        return null;
    }

    // Calcular diagnóstico inteligente basado en el Kardex de los últimos 7 días
    const productIds = (items || []).map((item: any) => item.product_id);
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - 7);

    let recentTrans: any[] = [];
    if (productIds.length > 0) {
        const { data } = await supabase
            .from("inventory_transactions")
            .select("product_id, transaction_type, created_at")
            .eq("warehouse_id", audit.warehouse_id)
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

    return {
        ...audit,
        items: itemsWithDiagnostics
    };
}

// Crear una Auditoría en estado Borrador ('draft')
export async function createInventoryAudit(warehouseId: string, notes?: string) {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);
    const { data: { user } } = await supabase.auth.getUser();

    if (!clinicId || !user) {
        return { success: false, message: "No autorizado." };
    }

    if (!warehouseId) {
        return { success: false, message: "Debes seleccionar un almacén para auditar." };
    }

    // 1. Insertar cabecera de auditoría
    const { data: audit, error: auditError } = await supabase
        .from("inventory_audits")
        .insert({
            clinic_id: clinicId,
            warehouse_id: warehouseId,
            status: "draft",
            notes: notes?.trim() || null,
            created_by: user.id
        })
        .select()
        .single();

    if (auditError || !audit) {
        console.error("Error al crear auditoría:", auditError);
        return { success: false, message: "Error al registrar la auditoría física." };
    }

    // 2. Buscar todos los lotes del almacén para precargarlos (incluso con stock 0 para conteo)
    const { data: batches, error: batchesError } = await supabase
        .from("inventory_batches")
        .select("id, product_id, quantity")
        .eq("warehouse_id", warehouseId);

    if (batchesError) {
        console.error("Error al obtener lotes del almacén:", batchesError);
        // Rollback cabecera
        await supabase.from("inventory_audits").delete().eq("id", audit.id);
        return { success: false, message: "Error al cargar la información de stock del almacén." };
    }

    if (!batches || batches.length === 0) {
        // Permitimos crear una auditoría vacía, pero notificamos al usuario
        revalidatePath("/dashboard/inventory/audits");
        return { success: true, message: "Auditoría creada. El almacén seleccionado no tiene lotes registrados actualmente.", auditId: audit.id };
    }

    // 3. Registrar los componentes en inventory_audit_items
    const auditItems = batches.map(batch => ({
        audit_id: audit.id,
        product_id: batch.product_id,
        batch_id: batch.id,
        expected_quantity: Number(batch.quantity),
        actual_quantity: Number(batch.quantity) // Por defecto inicializamos con el stock esperado
    }));

    const { error: itemsError } = await supabase
        .from("inventory_audit_items")
        .insert(auditItems);

    if (itemsError) {
        console.error("Error al registrar items de auditoría:", itemsError);
        // Rollback cabecera
        await supabase.from("inventory_audits").delete().eq("id", audit.id);
        return { success: false, message: "Error al configurar los componentes de la toma física." };
    }

    revalidatePath("/dashboard/inventory/audits");
    return { success: true, message: "Toma física iniciada en modo Borrador.", auditId: audit.id };
}

// Guardar conteo físico temporalmente con causas de discrepancia
export async function updateInventoryAuditItems(
    auditId: string,
    itemsToUpdate: { itemId: string; actualQuantity: number; discrepancyReason?: string }[]
) {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);

    if (!clinicId) return { success: false, message: "No autorizado." };

    // Validar estado de la auditoría
    const { data: audit, error: auditError } = await supabase
        .from("inventory_audits")
        .select("status")
        .eq("id", auditId)
        .single();

    if (auditError || !audit) return { success: false, message: "Auditoría no encontrada." };
    if (audit.status !== "draft") return { success: false, message: "Solo se pueden guardar cambios en auditorías en borrador." };

    // Actualizar cada cantidad real y causa de discrepancia en lote
    for (const item of itemsToUpdate) {
        const qty = Number(item.actualQuantity);
        if (isNaN(qty) || qty < 0) continue;

        const updateData: any = { 
            actual_quantity: qty,
            discrepancy_reason: item.discrepancyReason || null
        };

        await supabase
            .from("inventory_audit_items")
            .update(updateData)
            .eq("id", item.itemId)
            .eq("audit_id", auditId);
    }

    return { success: true, message: "Conteos reales y causas raíces guardados en borrador." };
}

// Confirmar auditoría (Aplica los ajustes reales de stock y escribe en Kardex)
export async function confirmInventoryAudit(auditId: string) {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);
    const { data: { user } } = await supabase.auth.getUser();

    if (!clinicId || !user) {
        return { success: false, message: "No autorizado." };
    }

    // 1. Obtener la auditoría con sus componentes
    const audit = await getInventoryAuditById(auditId);
    if (!audit) return { success: false, message: "Auditoría no encontrada." };
    if (audit.status !== "draft") return { success: false, message: "Esta auditoría ya fue cerrada o cancelada." };

    // Mapear motivos a español para el registro en Kardex
    const reasonLabels: Record<string, string> = {
        'counting_error': 'Error de Conteo / Rectificación',
        'clinical_omission': 'Omisión de Registro Clínico',
        'damaged_expired': 'Producto Dañado / Vencido',
        'unexplained_loss': 'Pérdida Inexplicable',
        'unexplained_surplus': 'Sobrante Inexplicable'
    };

    // 2. Procesar discrepancias y aplicar ajustes
    for (const item of audit.items) {
        const expected = Number(item.expected_quantity);
        const actual = Number(item.actual_quantity);
        const discrepancy = actual - expected;

        // A. Si hay discrepancia, modificamos el stock del lote
        if (discrepancy !== 0 && item.batch_id) {
            // Actualizar el stock en el lote
            const { error: updateBatchError } = await supabase
                .from("inventory_batches")
                .update({ quantity: actual })
                .eq("id", item.batch_id);

            if (updateBatchError) {
                console.error(`Error al ajustar stock de lote ${item.batch_id}:`, updateBatchError);
                return { success: false, message: `Fallo al reajustar lote de producto.` };
            }

            const motivoText = item.discrepancy_reason 
                ? ` Causa: ${reasonLabels[item.discrepancy_reason] || item.discrepancy_reason}.` 
                : '';

            // B. Registrar la transacción en el Kardex (inventory_transactions)
            const { error: transError } = await supabase
                .from("inventory_transactions")
                .insert({
                    clinic_id: clinicId,
                    product_id: item.product_id,
                    batch_id: item.batch_id,
                    warehouse_id: audit.warehouse_id,
                    transaction_type: "adjustment",
                    quantity: discrepancy,
                    notes: `Ajuste por Auditoría Física (Ref: AUD-${audit.id.slice(0, 8).toUpperCase()}). Esperado: ${expected}, Encontrado: ${actual}.${motivoText}`,
                    created_by: user.id
                });

            if (transError) {
                console.error(`Error al escribir ajuste en Kardex para producto ${item.product_id}:`, transError);
            }
        }
    }

    // 3. Marcar la auditoría como confirmada
    const { error: confirmError } = await supabase
        .from("inventory_audits")
        .update({ status: "confirmed" })
        .eq("id", auditId);

    if (confirmError) {
        console.error("Error al cerrar auditoría:", confirmError);
        return { success: false, message: "Error al cambiar estado de auditoría." };
    }

    revalidatePath("/dashboard/inventory/audits");
    revalidatePath("/dashboard/inventory");
    return { success: true, message: "Auditoría confirmada con éxito. El inventario ha sido conciliado." };
}

// Cancelar una auditoría (Solo si está en estado 'draft')
export async function cancelInventoryAudit(id: string) {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);

    if (!clinicId) return { success: false, message: "No autorizado." };

    const { data: audit, error: fetchError } = await supabase
        .from("inventory_audits")
        .select("status")
        .eq("id", id)
        .eq("clinic_id", clinicId)
        .single();

    if (fetchError || !audit) return { success: false, message: "Auditoría no encontrada." };
    if (audit.status !== "draft") return { success: false, message: "Solo se pueden cancelar auditorías en borrador." };

    const { error } = await supabase
        .from("inventory_audits")
        .update({ status: "canceled" })
        .eq("id", id)
        .eq("clinic_id", clinicId);

    if (error) {
        console.error("Error al cancelar auditoría:", error);
        return { success: false, message: "Error al cancelar la auditoría." };
    }

    revalidatePath("/dashboard/inventory/audits");
    return { success: true, message: "Auditoría cancelada correctamente." };
}

// Obtener estadísticas consolidadas de mermas y pérdidas (Pilar 6)
export async function getInventoryWastageStats() {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);

    if (!clinicId) {
        return {
            totalLossValue: 0,
            totalSurplusValue: 0,
            totalDiscrepanciesCount: 0,
            totalItemsAudited: 0,
            breakdown: {},
            topProducts: [],
            topWarehouses: []
        };
    }

    // 1. Obtener auditorías confirmadas
    const { data: audits, error: auditsError } = await supabase
        .from("inventory_audits")
        .select("id, warehouse_id, warehouse:warehouses(name)")
        .eq("clinic_id", clinicId)
        .eq("status", "confirmed");

    if (auditsError || !audits || audits.length === 0) {
        return {
            totalLossValue: 0,
            totalSurplusValue: 0,
            totalDiscrepanciesCount: 0,
            totalItemsAudited: 0,
            breakdown: {},
            topProducts: [],
            topWarehouses: []
        };
    }

    const auditIds = audits.map(a => a.id);
    const warehouseMap = audits.reduce((acc: Record<string, string>, curr) => {
        acc[curr.id] = curr.warehouse?.name || "General";
        return acc;
    }, {});

    // 2. Obtener todos los ítems de esas auditorías
    const { data: items, error: itemsError } = await supabase
        .from("inventory_audit_items")
        .select(`
            id,
            audit_id,
            product_id,
            expected_quantity,
            actual_quantity,
            discrepancy_reason,
            product:products(name, sale_price, unit)
        `)
        .in("audit_id", auditIds);

    if (itemsError || !items || items.length === 0) {
        return {
            totalLossValue: 0,
            totalSurplusValue: 0,
            totalDiscrepanciesCount: 0,
            totalItemsAudited: items?.length || 0,
            breakdown: {},
            topProducts: [],
            topWarehouses: []
        };
    }

    let totalLossValue = 0;
    let totalSurplusValue = 0;
    let totalDiscrepanciesCount = 0;
    const totalItemsAudited = items.length;

    // Estructuras para agregaciones
    const breakdown: Record<string, { value: number; count: number }> = {
        'counting_error': { value: 0, count: 0 },
        'clinical_omission': { value: 0, count: 0 },
        'damaged_expired': { value: 0, count: 0 },
        'unexplained_loss': { value: 0, count: 0 },
        'unexplained_surplus': { value: 0, count: 0 },
        'other': { value: 0, count: 0 }
    };

    const productStats: Record<string, { name: string; lossValue: number; unitsLost: number; unit: string }> = {};
    const warehouseStats: Record<string, { name: string; lossValue: number; surplusValue: number }> = {};

    items.forEach((item: any) => {
        const expected = Number(item.expected_quantity);
        const actual = Number(item.actual_quantity);
        const discrepancy = actual - expected;
        const price = Number(item.product?.sale_price || 0);
        const costValue = Math.abs(discrepancy) * price;

        const warehouseName = warehouseMap[item.audit_id] || "General";

        // Inicializar almacén si no existe
        if (!warehouseStats[warehouseName]) {
            warehouseStats[warehouseName] = { name: warehouseName, lossValue: 0, surplusValue: 0 };
        }

        if (discrepancy !== 0) {
            totalDiscrepanciesCount++;

            // Clasificación por motivo
            const reason = item.discrepancy_reason || "other";
            if (!breakdown[reason]) {
                breakdown[reason] = { value: 0, count: 0 };
            }
            breakdown[reason].value += costValue;
            breakdown[reason].count++;

            if (discrepancy < 0) {
                // Pérdida
                totalLossValue += costValue;
                warehouseStats[warehouseName].lossValue += costValue;

                // Agregar a estadísticas del producto
                const prodId = item.product_id;
                if (!productStats[prodId]) {
                    productStats[prodId] = {
                        name: item.product?.name || "Desconocido",
                        lossValue: 0,
                        unitsLost: 0,
                        unit: item.product?.unit || "und"
                    };
                }
                productStats[prodId].lossValue += costValue;
                productStats[prodId].unitsLost += Math.abs(discrepancy);
            } else {
                // Sobrante
                totalSurplusValue += costValue;
                warehouseStats[warehouseName].surplusValue += costValue;
            }
        }
    });

    // Formatear top 5 productos con mayor pérdida
    const topProducts = Object.values(productStats)
        .sort((a, b) => b.lossValue - a.lossValue)
        .slice(0, 5);

    // Formatear estadísticas de almacenes
    const topWarehouses = Object.values(warehouseStats);

    return {
        totalLossValue,
        totalSurplusValue,
        totalDiscrepanciesCount,
        totalItemsAudited,
        breakdown,
        topProducts,
        topWarehouses
    };
}

