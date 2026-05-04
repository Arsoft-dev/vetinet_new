"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getPendingOrders() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "No autenticado" };

    const supabaseAdmin = createAdminClient();
    const { data: member } = await supabaseAdmin
        .from("clinic_members")
        .select("clinic_id")
        .eq("user_id", user.id)
        .single();

    if (!member) return { success: false, message: "No clinic found" };

    // Fetch medical records with 'pending_payment' status
    const { data: records, error } = await supabaseAdmin
        .from("medical_records")
        .select(`
            id,
            visit_date,
            reason,
            vet_id,
            vet:users!medical_records_vet_id_fkey(full_name),
            pet:pets(
                id, 
                name, 
                species, 
                owner_id,
                client:clients!pets_owner_id_fkey(id, full_name, identification_doc)
            )
        `)
        .eq("clinic_id", member.clinic_id)
        .eq("billing_status", "pending_payment")
        .order("visit_date", { ascending: false });

    if (error) {
        console.error("Error fetching pending orders:", error);
        return { success: false, message: error.message };
    }

    // Transform into a cleaner structure
    const orders = [];
    for (const record of (records || [])) {
        // Fetch consultation items for this record
        const { data: items } = await supabaseAdmin
            .from("consultation_items")
            .select(`
                id,
                quantity,
                unit_price,
                total_price,
                product_id,
                product:products(name, category)
            `)
            .eq("medical_record_id", record.id);

        if (!items || items.length === 0) continue; // Si no hay items a cobrar, ignorar (aunque siempre debería estar la consulta)

        orders.push({
            medicalRecordId: record.id,
            date: record.visit_date,
            reason: record.reason,
            vetName: record.vet?.full_name || 'Dr. Vet',
            petName: record.pet?.name || 'Mascota',
            client: record.pet?.client ? {
                id: record.pet.client.id,
                name: record.pet.client.full_name,
                doc: record.pet.client.identification_doc
            } : null,
            items: items.map(item => ({
                id: item.id,
                productId: item.product_id,
                name: item.product?.name || 'Producto General',
                quantity: item.quantity,
                unitPrice: item.unit_price,
                category: item.product?.category || 'Service',
                fromConsultation: true // Flag clave para no descontar inventario
            }))
        });
    }

    return { success: true, orders };
}
