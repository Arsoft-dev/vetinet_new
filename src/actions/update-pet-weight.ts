"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updatePetWeight(petId: string, newWeight: number) {
    if (!petId) return { success: false, message: "ID de mascota requerido" };

    const supabase = createAdminClient();

    try {
        const { error } = await supabase
            .from("pets")
            .update({ weight_kg: newWeight })
            .eq("id", petId);

        if (error) throw error;

        revalidatePath("/dashboard/patients");
        return { success: true, message: "Peso actualizado correctamente" };
    } catch (error: any) {
        console.error("Error updating weight:", error);
        return { success: false, message: "Error al actualizar el peso" };
    }
}
