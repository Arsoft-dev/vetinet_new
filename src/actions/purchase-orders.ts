"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendPurchaseOrderEmail } from "./emails";
import { generatePurchaseOrderPDF } from "./pdf-generator";

// Función auxiliar para obtener el ID de la clínica
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

// Crear una Orden de Compra (Borrador 'pending')
export async function createPurchaseOrder(data: {
    supplierId: string;
    warehouseId: string;
    notes?: string;
    items: { productId: string; quantity: number; unitPrice: number }[];
}) {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);
    const { data: { user } } = await supabase.auth.getUser();

    if (!clinicId || !user) {
        return { success: false, message: "No autorizado o no asociado a una clínica." };
    }

    if (!data.supplierId) return { success: false, message: "Debes seleccionar un proveedor." };
    if (!data.warehouseId) return { success: false, message: "Debes seleccionar un almacén de destino." };
    if (!data.items || data.items.length === 0) return { success: false, message: "La orden debe contener al menos un producto." };

    // Generar un número de orden único
    const orderNumber = `OC-${Date.now().toString().slice(-8)}`;

    const totalAmount = data.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

    // 1. Insertar Cabecera de la Orden
    const { data: order, error: orderError } = await supabase
        .from("purchase_orders")
        .insert({
            clinic_id: clinicId,
            supplier_id: data.supplierId,
            warehouse_id: data.warehouseId,
            order_number: orderNumber,
            status: "pending",
            total_amount_usd: totalAmount,
            notes: data.notes || null,
            issued_by: user.id
        })
        .select()
        .single();

    if (orderError || !order) {
        console.error("Error al crear cabecera de orden de compra:", orderError);
        return { success: false, message: "Error al registrar la orden de compra." };
    }

    // 2. Insertar Detalle de Items
    const orderItems = data.items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        received_quantity: 0,
        unit_price: item.unitPrice
    }));

    const { error: itemsError } = await supabase
        .from("purchase_order_items")
        .insert(orderItems);

    if (itemsError) {
        console.error("Error al registrar ítems de la orden de compra:", itemsError);
        // Intentar rollback eliminando la cabecera
        await supabase.from("purchase_orders").delete().eq("id", order.id);
        return { success: false, message: "Error al registrar los productos de la orden de compra." };
    }

    revalidatePath("/dashboard/inventory/suppliers/purchase-orders");
    return { success: true, message: `Orden de compra ${orderNumber} creada exitosamente.` };
}

// Obtener todas las órdenes de compra de la clínica
export async function getPurchaseOrders() {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);

    if (!clinicId) return [];

    const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
            *,
            supplier:suppliers(name),
            warehouse:warehouses(name),
            issuer:users(full_name)
        `)
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error al obtener órdenes de compra:", error);
        return [];
    }

    return data || [];
}

// Obtener una orden de compra detallada con sus ítems
export async function getPurchaseOrderById(id: string) {
    const supabase = await createClient();
    
    // Obtener cabecera
    const { data: order, error: orderError } = await supabase
        .from("purchase_orders")
        .select(`
            *,
            supplier:suppliers(name, contact_person, phone, email, tax_id, address),
            warehouse:warehouses(name),
            issuer:users(full_name)
        `)
        .eq("id", id)
        .single();

    if (orderError || !order) {
        console.error("Error al obtener cabecera de orden de compra:", orderError);
        return null;
    }

    // Obtener ítems detallados
    const { data: items, error: itemsError } = await supabase
        .from("purchase_order_items")
        .select(`
            *,
            product:products(name, unit, barcode)
        `)
        .eq("order_id", id);

    if (itemsError) {
        console.error("Error al obtener ítems de la orden de compra:", itemsError);
        return null;
    }

    return {
        ...order,
        items: items || []
    };
}

// Cambiar estado de la Orden (Ej: de pending a ordered)
export async function updatePurchaseOrderStatus(
    id: string, 
    status: "pending" | "ordered" | "canceled",
    sendEmailNotification?: boolean
) {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);

    if (!clinicId) return { success: false, message: "No autorizado." };

    const { error } = await supabase
        .from("purchase_orders")
        .update({ status })
        .eq("id", id)
        .eq("clinic_id", clinicId);

    if (error) {
        console.error("Error al actualizar estado de orden:", error);
        return { success: false, message: "Error al cambiar el estado." };
    }

    let emailSent = false;
    let emailError = "";

    if (status === "ordered" && sendEmailNotification) {
        try {
            // Obtener el detalle completo de la orden
            const orderDetail = await getPurchaseOrderById(id);
            if (orderDetail && orderDetail.supplier?.email) {
                // Obtener datos de la clínica para la cabecera del PDF y comercial
                const { data: clinic } = await supabase
                    .from("clinics")
                    .select("name, address, phone, logo_url, rif")
                    .eq("id", clinicId)
                    .single();

                const clinicName = clinic?.name || "Vetinet Elite";

                // Mapear los ítems para el cuerpo del correo
                const itemsForEmail = orderDetail.items.map((item: any) => ({
                    name: item.product?.name || "Producto",
                    quantity: Number(item.quantity),
                    unit: item.product?.unit || "und",
                    unitPrice: Number(item.unit_price)
                }));

                // Ensamblar el objeto completo para la generación del PDF comercial
                const orderObjectForPDF = {
                    ...orderDetail,
                    clinic: clinic || null
                };

                // Generar el archivo PDF comercial en memoria
                console.log(`📄 Generando PDF para la orden ${orderDetail.order_number}...`);
                const pdfBuffer = await generatePurchaseOrderPDF(orderObjectForPDF);

                // Enviar correo adjuntando el PDF comercial
                const mailRes = await sendPurchaseOrderEmail({
                    email: orderDetail.supplier.email,
                    orderNumber: orderDetail.order_number,
                    supplierName: orderDetail.supplier.name,
                    clinicName,
                    items: itemsForEmail,
                    totalAmount: Number(orderDetail.total_amount_usd),
                    notes: orderDetail.notes || undefined,
                    pdfBuffer
                });

                if (mailRes.success) {
                    emailSent = true;
                } else {
                    emailError = String(mailRes.error);
                }
            }
        } catch (e: any) {
            console.error("Error al enviar email de OC:", e);
            emailError = e.message;
        }
    }

    revalidatePath("/dashboard/inventory/suppliers/purchase-orders");

    let message = `Orden actualizada a estado "${status}".`;
    if (sendEmailNotification) {
        if (emailSent) {
            message += " Correo de notificación enviado al proveedor.";
        } else if (emailError) {
            message += ` Sin embargo, falló el envío del correo: ${emailError}`;
        }
    }

    return { success: true, message };
}

// Recibir mercancía (permite recibir parcial o total, generando lotes y transacciones)
export async function receivePurchaseOrder(
    orderId: string,
    warehouseId: string,
    itemsToReceive: {
        itemId: string;        // ID de la fila en purchase_order_items
        productId: string;
        quantityReceived: number;
        batchNumber?: string;
        expiryDate?: string;
    }[]
) {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);
    const { data: { user } } = await supabase.auth.getUser();

    if (!clinicId || !user) {
        return { success: false, message: "No autorizado." };
    }

    // 1. Obtener la orden actual
    const { data: order, error: orderError } = await supabase
        .from("purchase_orders")
        .select("*")
        .eq("id", orderId)
        .single();

    if (orderError || !order) {
        return { success: false, message: "Orden de compra no encontrada." };
    }

    if (order.status === "received" || order.status === "canceled") {
        return { success: false, message: "Esta orden de compra ya está cerrada o cancelada." };
    }

    let itemsProcessed = 0;

    // Procesar cada ítem recibido
    for (const item of itemsToReceive) {
        if (item.quantityReceived <= 0) continue;

        itemsProcessed++;

        // A. Actualizar la cantidad recibida en la tabla purchase_order_items
        const { error: updateItemError } = await supabase
            .from("purchase_order_items")
            .update({ received_quantity: item.quantityReceived })
            .eq("id", item.itemId);

        if (updateItemError) {
            console.error(`Error actualizando item ${item.itemId}:`, updateItemError);
            continue; // Intentamos continuar con los demás
        }

        // B. Crear el lote (inventory_batches) en el almacén especificado
        const batchNum = item.batchNumber?.trim() || `GEN-${Date.now().toString().slice(-6)}`;
        const { data: batch, error: batchError } = await supabase
            .from("inventory_batches")
            .insert({
                product_id: item.productId,
                warehouse_id: warehouseId,
                batch_number: batchNum,
                expiry_date: item.expiryDate || null,
                quantity: item.quantityReceived
            })
            .select()
            .single();

        if (batchError || !batch) {
            console.error(`Error creando lote para producto ${item.productId}:`, batchError);
            continue;
        }

        // C. Registrar la transacción de inventario (Kardex)
        const { error: transError } = await supabase
            .from("inventory_transactions")
            .insert({
                clinic_id: clinicId,
                product_id: item.productId,
                batch_id: batch.id,
                warehouse_id: warehouseId,
                transaction_type: "purchase",
                quantity: item.quantityReceived,
                notes: `Ingreso por Orden de Compra ${order.order_number} (Lote: ${batchNum})`,
                created_by: user.id
            });

        if (transError) {
            console.error(`Error creando transacción para producto ${item.productId}:`, transError);
        }
    }

    if (itemsProcessed === 0) {
        return { success: false, message: "No se procesó ninguna cantidad recibida mayor a cero." };
    }

    // 2. Marcar la Orden de Compra como 'received' y guardar la fecha de recepción
    const { error: closeOrderError } = await supabase
        .from("purchase_orders")
        .update({
            status: "received",
            received_at: new Date().toISOString()
        })
        .eq("id", orderId);

    if (closeOrderError) {
        console.error("Error al cerrar la orden de compra:", closeOrderError);
    }

    revalidatePath("/dashboard/inventory/suppliers/purchase-orders");
    revalidatePath("/dashboard/inventory");

    return { success: true, message: "Mercancía ingresada y registrada en el inventario con éxito." };
}
