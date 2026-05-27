"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function notifyLowStockAlert(productId: string, clinicId: string) {
    const supabaseAdmin = createAdminClient();

    // 1. Get product current total stock and min stock level
    const { data: product } = await supabaseAdmin
        .from("products")
        .select(`
            id, 
            name, 
            min_stock_level, 
            inventory_batches(quantity)
        `)
        .eq("id", productId)
        .eq("clinic_id", clinicId)
        .single();

    if (!product || product.min_stock_level === null) return;

    // Calculate total stock
    const totalStock = product.inventory_batches?.reduce((acc: number, batch: any) => acc + batch.quantity, 0) || 0;

    // If stock is strictly below minimum, trigger alert
    if (totalStock < product.min_stock_level) {
        // Find admins and managers for this clinic
        const { data: admins } = await supabaseAdmin
            .from("clinic_members")
            .select("user_id")
            .eq("clinic_id", clinicId)
            .in("role", ["admin", "manager"])
            .eq("status", "active");

        if (!admins || admins.length === 0) return;

        // Check if an alert was already sent recently (within last 12 hours) to avoid spam
        // But for "real-time" we might want to notify once per drop.
        // For simplicity, we just create it. 
        const title = "⚠️ Stock Crítico Alcanzado";
        const message = `El producto "${product.name}" ha caído por debajo del nivel mínimo (${totalStock} / ${product.min_stock_level}).`;
        const type = "inventory";

        const notificationsToInsert = admins.map(admin => ({
            clinic_id: clinicId,
            user_id: admin.user_id,
            title,
            message,
            type,
            read: false
        }));

        await supabaseAdmin.from("notifications").insert(notificationsToInsert);
    }
}
