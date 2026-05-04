"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { addDays, format } from "date-fns";

export async function checkInventoryAlerts() {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Get user's clinic
    const { data: member } = await supabaseAdmin
        .from("clinic_members")
        .select("clinic_id")
        .eq("user_id", user.id)
        .single();

    if (!member) return;
    const clinicId = member.clinic_id;

    // 2. Check for Low Stock
    // Query products where total_stock <= min_stock_level
    // Note: total_stock needs to be calculated if not a column, but in our schema 
    // it's likely managed by inventory_transactions. Let's assume we search products.
    const { data: products } = await supabaseAdmin
        .from("products")
        .select("id, name, min_stock_level")
        .eq("clinic_id", clinicId);

    if (products) {
        for (const product of products) {
            // Get current stock count
            const { data: stockData } = await supabaseAdmin.rpc('get_product_stock', { p_product_id: product.id });
            const totalStock = stockData || 0;

            if (totalStock <= (product.min_stock_level || 5)) {
                // Check if we already notified recently (last 24h)
                const { count } = await supabaseAdmin
                    .from("notifications")
                    .select("*", { count: 'exact', head: true })
                    .eq("user_id", user.id)
                    .eq("type", "stock_low")
                    .eq("metadata->product_id", product.id)
                    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

                if (count === 0) {
                    await supabaseAdmin.from("notifications").insert({
                        clinic_id: clinicId,
                        user_id: user.id,
                        title: "⚠️ Stock Bajo",
                        message: `El producto "${product.name}" tiene solo ${totalStock} unidades disponibles.`,
                        type: "stock_low",
                        metadata: { product_id: product.id, current_stock: totalStock }
                    });
                }
            }
        }
    }

    // 3. Check for Expiring Batches (Next 30 days)
    const thirtyDaysFromNow = addDays(new Date(), 30).toISOString();
    const { data: expiringBatches } = await supabaseAdmin
        .from("inventory_batches")
        .select(`
            id,
            batch_number,
            expiry_date,
            product:products(name, clinic_id)
        `)
        .lte("expiry_date", thirtyDaysFromNow)
        .gte("expiry_date", new Date().toISOString());

    if (expiringBatches) {
        for (const batch of expiringBatches) {
            if ((batch.product as any)?.clinic_id !== clinicId) continue;

            // Check if already notified
            const { count } = await supabaseAdmin
                .from("notifications")
                .select("*", { count: 'exact', head: true })
                .eq("user_id", user.id)
                .eq("type", "stock_expiring")
                .eq("metadata->batch_id", batch.id);

            if (count === 0) {
                await supabaseAdmin.from("notifications").insert({
                    clinic_id: clinicId,
                    user_id: user.id,
                    title: "📅 Expiración Próxima",
                    message: `El lote "${batch.batch_number}" de "${(batch.product as any).name}" vence el ${format(new Date(batch.expiry_date), 'dd/MM/yyyy')}.`,
                    type: "stock_expiring",
                    metadata: { batch_id: batch.id, expiry_date: batch.expiry_date }
                });
            }
        }
    }
}
