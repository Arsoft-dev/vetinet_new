"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { completeInventoryTransfer, createInventoryTransfer } from "./inventory-transfers";

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

// Obtener todas las requisiciones de la clínica
export async function getInventoryRequisitions() {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);

    if (!clinicId) return [];

    const { data, error } = await supabase
        .from("inventory_requisitions")
        .select(`
            *,
            destination_warehouse:warehouses!fk_warehouse(name),
            requester:users!fk_requester(full_name)
        `)
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error al obtener requisiciones:", error);
        return [];
    }

    return data || [];
}

// Obtener detalle de una requisición
export async function getInventoryRequisitionById(id: string) {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);

    if (!clinicId) return null;

    const { data: requisition, error } = await supabase
        .from("inventory_requisitions")
        .select(`
            *,
            destination_warehouse:warehouses!fk_warehouse(name),
            requester:users!fk_requester(full_name)
        `)
        .eq("id", id)
        .eq("clinic_id", clinicId)
        .single();

    if (error || !requisition) {
        console.error("Error al obtener requisición:", error);
        return null;
    }

    const { data: items, error: itemsError } = await supabase
        .from("inventory_requisition_items")
        .select(`
            *,
            product:products(name, unit, barcode)
        `)
        .eq("requisition_id", id);

    if (itemsError) {
        console.error("Error al obtener ítems de requisición:", itemsError);
        return null;
    }

    return {
        ...requisition,
        items: items || []
    };
}

// Crear una requisición de reposición
export async function createInventoryRequisition(data: {
    destinationWarehouseId: string;
    notes?: string;
    items: { productId: string; quantity: number }[];
}) {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);
    const { data: { user } } = await supabase.auth.getUser();

    if (!clinicId || !user) {
        return { success: false, message: "No autorizado." };
    }

    if (!data.destinationWarehouseId) {
        return { success: false, message: "Debes seleccionar el almacén de destino." };
    }

    if (!data.items || data.items.length === 0) {
        return { success: false, message: "Debes ingresar al menos un producto a solicitar." };
    }

    // 1. Crear cabecera
    const { data: requisition, error: reqError } = await supabase
        .from("inventory_requisitions")
        .insert({
            clinic_id: clinicId,
            requester_id: user.id,
            destination_warehouse_id: data.destinationWarehouseId,
            notes: data.notes?.trim() || null,
            status: "pending"
        })
        .select()
        .single();

    if (reqError || !requisition) {
        console.error("Error al registrar requisición:", reqError);
        return { success: false, message: "Error al registrar la solicitud de reposición." };
    }

    // 2. Insertar ítems
    const requisitionItems = data.items.map(item => ({
        requisition_id: requisition.id,
        product_id: item.productId,
        requested_quantity: item.quantity
    }));

    const { error: itemsError } = await supabase
        .from("inventory_requisition_items")
        .insert(requisitionItems);

    if (itemsError) {
        console.error("Error al registrar items de requisición:", itemsError);
        await supabase.from("inventory_requisitions").delete().eq("id", requisition.id);
        return { success: false, message: "Error al registrar los detalles de la solicitud." };
    }

    revalidatePath("/dashboard/inventory/requisitions");
    return { success: true, message: "Solicitud de reposición enviada con éxito al administrador." };
}

// Aprobar una requisición (Genera una transferencia y la completa aplicando FEFO)
export async function approveInventoryRequisition(id: string) {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);
    const { data: { user } } = await supabase.auth.getUser();

    if (!clinicId || !user) {
        return { success: false, message: "No autorizado." };
    }

    // 1. Obtener la requisición detallada
    const req = await getInventoryRequisitionById(id);
    if (!req) {
        return { success: false, message: "Solicitud no encontrada." };
    }

    if (req.status !== "pending") {
        return { success: false, message: `Esta solicitud ya se encuentra ${req.status === 'approved' ? 'aprobada' : 'rechazada'}.` };
    }

    // 2. Identificar el almacén principal (origen de la reposición)
    // Buscamos almacenes de tipo 'storage', priorizando el que se llame "Principal"
    const { data: warehouses } = await supabase
        .from("warehouses")
        .select("id, name")
        .eq("clinic_id", clinicId)
        .eq("is_active", true)
        .eq("type", "storage");

    if (!warehouses || warehouses.length === 0) {
        return { success: false, message: "No se encontró un almacén de almacenamiento principal (tipo 'storage') para suplir la mercancía." };
    }

    // Seleccionar el almacén principal
    const sourceWarehouse = warehouses.find(w => w.name.toLowerCase().includes("principal")) || warehouses[0];

    if (sourceWarehouse.id === req.destination_warehouse_id) {
        return { success: false, message: "El almacén de destino no puede ser el mismo almacén principal de almacenamiento." };
    }

    // 3. Determinar los lotes de origen usando estrategia FEFO para cada ítem solicitado
    const transferItems: { productId: string; batchId: string; quantity: number }[] = [];

    for (const item of req.items) {
        // Consultar lotes con existencias en el origen para este producto, ordenados por fecha de vencimiento (FEFO)
        const { data: batches, error: batchError } = await supabase
            .from("inventory_batches")
            .select("id, quantity, batch_number, expiry_date")
            .eq("product_id", item.product_id)
            .eq("warehouse_id", sourceWarehouse.id)
            .gt("quantity", 0)
            .order("expiry_date", { ascending: true, nullsFirst: false })
            .order("created_at", { ascending: true });

        if (batchError || !batches || batches.length === 0) {
            return { 
                success: false, 
                message: `No hay stock disponible en el almacén principal para el producto: ${item.product?.name}.` 
            };
        }

        let remaining = Number(item.requested_quantity);
        const selectedBatches: { productId: string; batchId: string; quantity: number }[] = [];

        for (const batch of batches) {
            if (remaining <= 0) break;
            const take = Math.min(Number(batch.quantity), remaining);
            selectedBatches.push({
                productId: item.product_id,
                batchId: batch.id,
                quantity: take
            });
            remaining -= take;
        }

        if (remaining > 0) {
            return {
                success: false,
                message: `Stock insuficiente en el almacén principal para suplir las ${item.requested_quantity} unidades solicitadas de ${item.product?.name}. Faltan ${remaining} unidades.`
            };
        }

        transferItems.push(...selectedBatches);
    }

    // 4. Crear la transferencia interna en estado 'pending'
    const transferRes = await createInventoryTransfer({
        fromWarehouseId: sourceWarehouse.id,
        toWarehouseId: req.destination_warehouse_id,
        notes: `Generado automáticamente por aprobación de Solicitud de Reposición (Ref: ${req.id}). Notas: ${req.notes || 'Ninguna'}`,
        items: transferItems
    });

    if (!transferRes.success) {
        return { success: false, message: `Error al crear transferencia interna: ${transferRes.message}` };
    }

    // 5. Completar la transferencia para mover físicamente el stock
    // Para obtener el ID de la transferencia que acabamos de crear, consultamos la última transferencia creada en la clínica
    const { data: latestTransfers } = await supabase
        .from("inventory_transfers")
        .select("id")
        .eq("clinic_id", clinicId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1);

    if (!latestTransfers || latestTransfers.length === 0) {
        return { success: false, message: "No se pudo recuperar la transferencia interna generada." };
    }

    const transferId = latestTransfers[0].id;
    const completionRes = await completeInventoryTransfer(transferId);

    if (!completionRes.success) {
        return { success: false, message: `Error al ejecutar movimiento de stock: ${completionRes.message}` };
    }

    // 6. Actualizar el estado de la requisición a 'approved'
    const { error: updateError } = await supabase
        .from("inventory_requisitions")
        .update({ status: "approved" })
        .eq("id", id);

    if (updateError) {
        console.error("Error al actualizar estado de requisición:", updateError);
    }

    revalidatePath("/dashboard/inventory/requisitions");
    revalidatePath("/dashboard/inventory/warehouses");
    return { success: true, message: "Solicitud aprobada y stock transferido exitosamente mediante transferencia interna." };
}

// Rechazar una requisición
export async function rejectInventoryRequisition(id: string) {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);

    if (!clinicId) return { success: false, message: "No autorizado." };

    const { error } = await supabase
        .from("inventory_requisitions")
        .update({ status: "rejected" })
        .eq("id", id)
        .eq("clinic_id", clinicId);

    if (error) {
        console.error("Error al rechazar requisición:", error);
        return { success: false, message: "Error al procesar el rechazo." };
    }

    revalidatePath("/dashboard/inventory/requisitions");
    return { success: true, message: "Solicitud de reposición rechazada." };
}
