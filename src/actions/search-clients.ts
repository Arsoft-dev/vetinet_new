"use server";

import { createClient } from "@/lib/supabase/server";

export async function searchClients(query: string) {
    const supabase = await createClient();

    // Identify Tenant (Clinic)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Find which clinic this vet belongs to from clinic_members
    // We can assume user is logged in
    // Note: Assuming RLS handles tenant isolation properly, but for clarity let's fetch clinic_id if needed
    // However, pets and clients are linked to clinic_id. Row Level Security should restrict to clinic.
    // Let's assume RLS is correct for `select` on `clients`.

    const { data: clients, error } = await supabase
        .from("clients")
        .select("id, full_name, email, phone, identification_doc, address")
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,identification_doc.ilike.%${query}%`)
        .limit(5);

    if (error) {
        console.error("Error searching clients:", error);
        return [];
    }

    return clients || [];
}
