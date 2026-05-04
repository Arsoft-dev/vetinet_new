"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface SaveVaccineState {
    success: boolean;
    message: string;
}

export async function saveVaccine(
    petId: string,
    prevState: any,
    formData: FormData
): Promise<SaveVaccineState> {
    try {
        console.log("saveVaccine: Starting for pet", petId);

        const supabase = await createClient();
        const supabaseAdmin = createAdminClient();

        // 1. Auth & Clinic Check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error("saveVaccine: Auth error", authError);
            return { success: false, message: "No autenticado" };
        }

        console.log("saveVaccine: User authenticated", user.id);

        const { data: member, error: memberError } = await supabaseAdmin
            .from("clinic_members")
            .select("clinic_id")
            .eq("user_id", user.id)
            .single();

        if (memberError || !member) {
            console.error("saveVaccine: Member error", memberError);
            return { success: false, message: "Clínica no encontrada" };
        }

        console.log("saveVaccine: Clinic found", member.clinic_id);

        // 2. Extract Data
        const vaccineName = formData.get("vaccineName") as string;
        const batchNumber = formData.get("batchNumber") as string;
        const nextDueDate = formData.get("nextDueDate") as string; // Optional

        if (!vaccineName) return { success: false, message: "El nombre es obligatorio" };

        // 3. Save to DB
        const { error } = await supabaseAdmin
            .from("vaccinations")
            .insert({
                clinic_id: member.clinic_id,
                pet_id: petId,
                vet_id: user.id,
                vaccine_name: vaccineName,
                batch_number: batchNumber || null,
                next_due_date: nextDueDate || null,
                applied_date: new Date().toISOString()
            });

        if (error) {
            console.error("saveVaccine: DB Insert Error", error);
            throw error;
        }

        console.log("saveVaccine: Success");

        // 4. Revalidate
        revalidatePath(`/dashboard/patients/${petId}`);
        return { success: true, message: "Vacuna registrada correctamente" };

    } catch (e: any) {
        console.error("saveVaccine: CRITICAL ERROR", e);
        return { success: false, message: `Error inesperado: ${e.message}` };
    }
}
