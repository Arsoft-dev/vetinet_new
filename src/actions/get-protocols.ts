"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getProtocols() {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: memberData } = await supabaseAdmin
        .from("clinic_members")
        .select("clinic_id")
        .eq("user_id", user.id)
        .single();

    if (!memberData) return [];

    const { data: protocols } = await supabaseAdmin
        .from("treatment_protocols")
        .select("*")
        .eq("clinic_id", memberData.clinic_id)
        .order("name", { ascending: true });

    return protocols || [];
}
