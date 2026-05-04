"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function saveProtocol(data: { id?: string; name: string; description: string; items: any[] }) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { data: memberData } = await supabaseAdmin
        .from("clinic_members")
        .select("clinic_id")
        .eq("user_id", user.id)
        .single();

    if (!memberData) throw new Error("No perteneces a una clínica");

    if (data.id) {
        // Update
        const { error } = await supabaseAdmin
            .from("treatment_protocols")
            .update({
                name: data.name,
                description: data.description,
                items: data.items
            })
            .eq("id", data.id);
        if (error) throw new Error(error.message);
    } else {
        // Create
        const { error } = await supabaseAdmin
            .from("treatment_protocols")
            .insert({
                clinic_id: memberData.clinic_id,
                name: data.name,
                description: data.description,
                items: data.items
            });
        if (error) throw new Error(error.message);
    }

    revalidatePath("/dashboard/treatments");
    return { success: true };
}

export async function deleteProtocol(id: string) {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
        .from("treatment_protocols")
        .delete()
        .eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/treatments");
    return { success: true };
}
