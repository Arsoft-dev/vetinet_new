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

// Obtener todas las transferencias de la clínica
export async function getInventoryTransfers() {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);

    if (!clinicId) return [];

    const { data, error } = await supabase
        .from("inventory_transfers")
        .select(`
            *,
            from_warehouse:warehouses!inventory_transfers_from_warehouse_id_fkey(name),
            to_warehouse:warehouses!inventory_transfers_to_warehouse_id_fkey(name),
            creator:users(full_name)
        `)
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error al obtener transferencias:", error);
        return [];
    }

    return data || [];
}

// Obtener detalle de una transferencia por ID
export async function getInventoryTransferById(id: string) {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);

    if (!clinicId) return null;

    // Obtener cabecera
    const { data: transfer, error: transferError } = await supabase
        .from("inventory_transfers")
        .select(`
            *,
            from_warehouse:warehouses!inventory_transfers_from_warehouse_id_fkey(name),
            to_warehouse:warehouses!inventory_transfers_to_warehouse_id_fkey(name),
            creator:users(full_name)
        `)
        .eq("id", id)
        .eq("clinic_id", clinicId)
        .single();

    if (transferError || !transfer) {
        console.error("Error al obtener cabecera de transferencia:", transferError);
        return null;
    }

    // Obtener items
    const { data: items, error: itemsError } = await supabase
        .from("inventory_transfer_items")
        .select(`
            *,
            product:products(name, unit, barcode),
            batch:inventory_batches(batch_number, expiry_date)
        `)
        .eq("transfer_id", id);

    if (itemsError) {
        console.error("Error al obtener ítems de transferencia:", itemsError);
        return null;
    }

    return {
        ...transfer,
        items: items || []
    };
}

// Crear una transferencia interna de stock (Estado 'pending')
export async function createInventoryTransfer(data: {
    fromWarehouseId: string;
    toWarehouseId: string;
    notes?: string;
    items: { productId: string; batchId: string; quantity: number }[];
}) {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);
    const { data: { user } } = await supabase.auth.getUser();

    if (!clinicId || !user) {
        return { success: false, message: "No autorizado." };
    }

    if (!data.fromWarehouseId || !data.toWarehouseId) {
        return { success: false, message: "Debes seleccionar almacén de origen y destino." };
    }

    if (data.fromWarehouseId === data.toWarehouseId) {
        return { success: false, message: "El almacén de origen y destino no pueden ser el mismo." };
    }

    if (!data.items || data.items.length === 0) {
        return { success: false, message: "Debes ingresar al menos un producto a transferir." };
    }

    // Validar stock disponible en el origen para cada lote
    for (const item of data.items) {
        if (item.quantity <= 0) {
            return { success: false, message: "La cantidad a transferir debe ser mayor a cero." };
        }

        const { data: batch, error: batchError } = await supabase
            .from("inventory_batches")
            .select("quantity, batch_number")
            .eq("id", item.batchId)
            .eq("warehouse_id", data.fromWarehouseId)
            .single();

        if (batchError || !batch) {
            return { success: false, message: `Lote de origen no encontrado para el producto.` };
        }

        if (Number(batch.quantity) < item.quantity) {
            return { 
                success: false, 
                message: `Stock insuficiente en el lote ${batch.batch_number} del almacén de origen. Disponible: ${batch.quantity}.` 
            };
        }
    }

    // 1. Insertar cabecera de la transferencia
    const { data: transfer, error: transferError } = await supabase
        .from("inventory_transfers")
        .insert({
            clinic_id: clinicId,
            from_warehouse_id: data.fromWarehouseId,
            to_warehouse_id: data.toWarehouseId,
            status: "pending",
            notes: data.notes?.trim() || null,
            created_by: user.id
        })
        .select()
        .single();

    if (transferError || !transfer) {
        console.error("Error al registrar transferencia:", transferError);
        return { success: false, message: "Error al registrar la transferencia." };
    }

    // 2. Insertar ítems
    const transferItems = data.items.map(item => ({
        transfer_id: transfer.id,
        product_id: item.productId,
        batch_id: item.batchId,
        quantity: item.quantity
    }));

    const { error: itemsError } = await supabase
        .from("inventory_transfer_items")
        .insert(transferItems);

    if (itemsError) {
        console.error("Error al registrar items de transferencia:", itemsError);
        // Rollback manual de la cabecera
        await supabase.from("inventory_transfers").delete().eq("id", transfer.id);
        return { success: false, message: "Error al registrar los detalles de la transferencia." };
    }

    revalidatePath("/dashboard/inventory/warehouses/transfers");
    return { success: true, message: "Transferencia registrada como pendiente." };
}

// Completar la transferencia (Mueve stock físicamente y registra en Kardex)
export async function completeInventoryTransfer(id: string) {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);
    const { data: { user } } = await supabase.auth.getUser();

    if (!clinicId || !user) {
        return { success: false, message: "No autorizado." };
    }

    // Obtener la transferencia detallada
    const transfer = await getInventoryTransferById(id);
    if (!transfer) {
        return { success: false, message: "Transferencia no encontrada." };
    }

    if (transfer.status === "completed") {
        return { success: false, message: "Esta transferencia ya ha sido completada." };
    }

    if (transfer.status === "canceled") {
        return { success: false, message: "No se puede completar una transferencia cancelada." };
    }

    // Procesar cada ítem de la transferencia
    for (const item of transfer.items) {
        // A. Obtener y validar lote de origen
        const { data: originBatch, error: originBatchError } = await supabase
            .from("inventory_batches")
            .select("*")
            .eq("id", item.batch_id)
            .eq("warehouse_id", transfer.from_warehouse_id)
            .single();

        if (originBatchError || !originBatch) {
            return { 
                success: false, 
                message: `El lote de origen para el producto ya no existe en el almacén de origen.` 
            };
        }

        if (Number(originBatch.quantity) < Number(item.quantity)) {
            return { 
                success: false, 
                message: `Stock insuficiente en el almacén de origen para completar la transferencia. Producto: ${item.product?.name}, Lote: ${originBatch.batch_number}.` 
            };
        }

        // B. Restar stock en el lote de origen
        const newOriginQty = Number(originBatch.quantity) - Number(item.quantity);
        const { error: updateOriginError } = await supabase
            .from("inventory_batches")
            .update({ quantity: newOriginQty })
            .eq("id", originBatch.id);

        if (updateOriginError) {
            console.error("Error al restar stock en origen:", updateOriginError);
            return { success: false, message: "Fallo al procesar el descuento en el almacén de origen." };
        }

        // C. Buscar o crear lote en el almacén de destino
        let targetBatchId = "";
        const { data: destBatch, error: destBatchError } = await supabase
            .from("inventory_batches")
            .select("id, quantity")
            .eq("product_id", item.product_id)
            .eq("warehouse_id", transfer.to_warehouse_id)
            .eq("batch_number", originBatch.batch_number)
            .limit(1)
            .maybeSingle();

        if (destBatch) {
            // Si ya existe, sumamos la cantidad
            const newDestQty = Number(destBatch.quantity) + Number(item.quantity);
            const { error: updateDestError } = await supabase
                .from("inventory_batches")
                .update({ quantity: newDestQty })
                .eq("id", destBatch.id);

            if (updateDestError) {
                console.error("Error al sumar stock en destino:", updateDestError);
                return { success: false, message: "Fallo al procesar el ingreso en el almacén de destino." };
            }
            targetBatchId = destBatch.id;
        } else {
            // Si no existe, creamos el lote con los mismos atributos del origen
            const { data: newBatch, error: createBatchError } = await supabase
                .from("inventory_batches")
                .insert({
                    product_id: item.product_id,
                    warehouse_id: transfer.to_warehouse_id,
                    batch_number: originBatch.batch_number,
                    expiry_date: originBatch.expiry_date,
                    quantity: item.quantity
                })
                .select()
                .single();

            if (createBatchError || !newBatch) {
                console.error("Error al crear lote en destino:", createBatchError);
                return { success: false, message: "Fallo al crear el lote en el almacén de destino." };
            }
            targetBatchId = newBatch.id;
        }

        // D. Registrar transacciones en el Kardex (inventory_transactions)
        
        // D1. Egreso del almacén de origen
        const { error: egressError } = await supabase
            .from("inventory_transactions")
            .insert({
                clinic_id: clinicId,
                product_id: item.product_id,
                batch_id: item.batch_id,
                warehouse_id: transfer.from_warehouse_id,
                transaction_type: "transfer",
                quantity: -Number(item.quantity),
                notes: `Transferencia interna (Salida) hacia Almacén: ${transfer.to_warehouse?.name || 'Destino'} (Ref: ${transfer.id})`,
                created_by: user.id
            });

        if (egressError) console.error("Error al registrar egreso en Kardex:", egressError);

        // D2. Ingreso al almacén de destino
        const { error: ingressError } = await supabase
            .from("inventory_transactions")
            .insert({
                clinic_id: clinicId,
                product_id: item.product_id,
                batch_id: targetBatchId,
                warehouse_id: transfer.to_warehouse_id,
                transaction_type: "transfer",
                quantity: Number(item.quantity),
                notes: `Transferencia interna (Entrada) desde Almacén: ${transfer.from_warehouse?.name || 'Origen'} (Ref: ${transfer.id})`,
                created_by: user.id
            });

        if (ingressError) console.error("Error al registrar ingreso en Kardex:", ingressError);
    }

    // 3. Actualizar estado de la transferencia a 'completed'
    const { error: updateTransferError } = await supabase
        .from("inventory_transfers")
        .update({ status: "completed" })
        .eq("id", id);

    if (updateTransferError) {
        console.error("Error al cambiar estado de transferencia:", updateTransferError);
    }

    revalidatePath("/dashboard/inventory/warehouses/transfers");
    revalidatePath("/dashboard/inventory");
    return { success: true, message: "Transferencia completada. El stock fue transferido con éxito." };
}

// Cancelar una transferencia (Solo si está en estado 'pending' o 'shipped')
export async function cancelInventoryTransfer(id: string) {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);

    if (!clinicId) return { success: false, message: "No autorizado." };

    const { data: transfer, error: fetchError } = await supabase
        .from("inventory_transfers")
        .select("status")
        .eq("id", id)
        .eq("clinic_id", clinicId)
        .single();

    if (fetchError || !transfer) {
        return { success: false, message: "Transferencia no encontrada." };
    }

    if (transfer.status === "completed") {
        return { success: false, message: "No se puede cancelar una transferencia que ya fue completada." };
    }

    if (transfer.status === "canceled") {
        return { success: false, message: "Esta transferencia ya se encuentra cancelada." };
    }

    const { error } = await supabase
        .from("inventory_transfers")
        .update({ status: "canceled" })
        .eq("id", id)
        .eq("clinic_id", clinicId);

    if (error) {
        console.error("Error al cancelar transferencia:", error);
        return { success: false, message: "Error al cancelar la transferencia." };
    }

    revalidatePath("/dashboard/inventory/warehouses/transfers");
    return { success: true, message: "Transferencia cancelada correctamente." };
}
