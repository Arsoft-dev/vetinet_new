"use server";

import { createClient } from "@/lib/supabase/server";

export async function searchClients(query: string) {
    const supabase = await createClient();

    // Identify Tenant (Clinic)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Find which clinic this user belongs to
    const { data: member } = await supabase
        .from("clinic_members")
        .select("clinic_id")
        .eq("user_id", user.id)
        .single();
        
    if (!member) return [];

    const { data: clients, error } = await supabase
        .from("clients")
        .select("id, full_name, email, phone, identification_doc, address")
        .eq("clinic_id", member.clinic_id)
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,identification_doc.ilike.%${query}%`)
        .limit(5);

    if (error) {
        console.error("Error searching clients:", error);
        return [];
    }

    return clients || [];
}
