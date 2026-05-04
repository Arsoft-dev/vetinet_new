"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function createQuickClient(formData: FormData) {
    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, message: "No autenticado" }

    const { data: memberData } = await supabaseAdmin.from("clinic_members").select("clinic_id").eq("user_id", user.id).single()

    if (!memberData) return { success: false, message: "No se encontró la clínica" }

    const name = formData.get("name") as string
    const doc = formData.get("doc") as string
    const phone = formData.get("phone") as string
    const email = formData.get("email") as string

    const { data: newClient, error } = await supabaseAdmin
        .from("clients")
        .insert({
            clinic_id: memberData.clinic_id,
            full_name: name,
            identification_doc: doc,
            phone: phone,
            email: email,
        })
        .select()
        .single()

    if (error) return { success: false, message: error.message }

    revalidatePath("/dashboard/billing/pos")
    return { success: true, client: newClient }
}

export async function getProducts() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "No autenticado" };
    const supabaseAdmin = createAdminClient();
    const { data: member } = await supabaseAdmin.from("clinic_members").select("clinic_id").eq("user_id", user.id).single();
    if (!member) return { success: false, message: "No clinic found" };

    // Fetch ALL Products (Services, Meds, Supplies) from the single 'products' table
    // We use is_archived = false based on migration_08
    const { data: products, error } = await supabaseAdmin
        .from("products")
        .select("*")
        .eq("clinic_id", member.clinic_id)
        .eq("is_archived", false);

    if (error) {
        console.error("Error fetching products:", error);
        return { success: false, products: [] };
    }

    // Normalize for POS
    const allItems = (products || []).map(p => ({
        id: p.id,
        name: p.name,
        price: p.sale_price || 0,
        category: p.category, // 'Medication', 'Service', etc.
        stock: 100, // TODO: Link to inventory_batches sum(quantity)
        type: p.category === 'Service' || p.category === 'MedicalService' ? 'service' : 'product'
    }));

    return { success: true, products: allItems };
}

export async function searchClients(query: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };
    const supabaseAdmin = createAdminClient();
    const { data: member } = await supabaseAdmin.from("clinic_members").select("clinic_id").eq("user_id", user.id).single();

    const { data: clients } = await supabaseAdmin
        .from("clients")
        .select("*")
        .eq("clinic_id", member?.clinic_id)
        .or(`full_name.ilike.%${query}%,identification_doc.ilike.%${query}%`)
        .limit(5);

    return { success: true, clients };
}
