"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function deletePatient(patientId: string) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "No autenticado" };

    // Security: Check if user belongs to the clinic of the patient
    const { data: patient } = await supabaseAdmin
        .from("pets")
        .select("clinic_id")
        .eq("id", patientId)
        .single();

    if (!patient) return { success: false, message: "Paciente no encontrado" };

    const { data: member } = await supabaseAdmin
        .from("clinic_members")
        .select("role")
        .eq("user_id", user.id)
        .eq("clinic_id", patient.clinic_id)
        .single();

    if (!member || member.role !== 'admin') {
        return { success: false, message: "Solo los administradores pueden eliminar pacientes" };
    }

    const { error } = await supabaseAdmin
        .from("pets")
        .delete()
        .eq("id", patientId);

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath("/dashboard/patients");
    return { success: true };
}
