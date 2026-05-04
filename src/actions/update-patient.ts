"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

interface UpdatePatientState {
    success: boolean;
    message: string;
    errors?: Record<string, string[]>;
}

export async function updatePatient(
    patientId: string,
    prevState: any,
    formData: FormData
): Promise<UpdatePatientState> {
    const supabaseAdmin = createAdminClient();

    // 1. Extract Data
    const rawData = {
        ownerName: formData.get("ownerName") as string,
        ownerEmail: formData.get("ownerEmail") as string,
        ownerPhone: formData.get("ownerPhone") as string,
        ownerDoc: formData.get("ownerDoc") as string,
        ownerAddress: formData.get("ownerAddress") as string,

        petName: formData.get("petName") as string,
        species: formData.get("species") as string,
        breed: formData.get("breed") as string,
        birthDate: formData.get("birthDate") as string,
        weight: formData.get("weight") as string,
        sex: formData.get("sex") as string,
        isNeutered: formData.get("isNeutered") === "true",

        avatarFile: formData.get("avatarFile") as File | null,

        // Anamnesis
        lastDewormingDate: formData.get("lastDewormingDate") as string,
        lastDewormingProduct: formData.get("lastDewormingProduct") as string,
        vaccinesHistory: formData.get("vaccinesHistory") as string,
        previousIllnesses: formData.get("previousIllnesses") as string,
        previousTreatments: formData.get("previousTreatments") as string,
        evolutionNotes: formData.get("evolutionNotes") as string,
        nutrition: formData.get("nutrition") as string,
        lastHeat: formData.get("lastHeat") as string,
        lastBirthDate: formData.get("lastBirthDate") as string,
        isDeceased: formData.get("isDeceased") === "true",
    };

    try {
        let avatarUrl = undefined;

        // 2. Handle Avatar Upload (if present)
        if (rawData.avatarFile && rawData.avatarFile.size > 0) {
            const file = rawData.avatarFile;
            const fileExt = file.name.split('.').pop();
            const fileName = `${patientId}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to 'avatars' bucket
            const { error: uploadError } = await supabaseAdmin
                .storage
                .from('avatars')
                .upload(filePath, file, {
                    contentType: file.type,
                    upsert: true
                });

            if (uploadError) {
                // Try 'public' bucket or fail gracefully? 
                // Let's log it and ignore for now to not break the whole update
                console.error("Avatar upload failed:", uploadError);
            } else {
                // Get Public URL
                const { data: { publicUrl } } = supabaseAdmin
                    .storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                avatarUrl = publicUrl;
            }
        }

        // 3. Update Pet
        const petUpdateData: any = {
            name: rawData.petName,
            species: rawData.species,
            breed: rawData.breed,
            birth_date: rawData.birthDate || null,
            weight_kg: rawData.weight ? parseFloat(rawData.weight) : null,
            sex: rawData.sex,
            is_neutered: rawData.isNeutered,
            is_deceased: rawData.isDeceased,

            // Anamnesis
            last_deworming_date: rawData.lastDewormingDate || null,
            last_deworming_product: rawData.lastDewormingProduct,
            vaccines_history: rawData.vaccinesHistory,
            previous_illnesses: rawData.previousIllnesses,
            previous_treatments: rawData.previousTreatments,
            evolution_notes: rawData.evolutionNotes,
            nutrition: rawData.nutrition,
            last_heat: rawData.lastHeat || null,
            last_birth_date: rawData.lastBirthDate || null,
        };

        if (avatarUrl) {
            petUpdateData.avatar_url = avatarUrl;
        }

        const { data: petData, error: petError } = await supabaseAdmin
            .from("pets")
            .update(petUpdateData)
            .eq("id", patientId)
            .select("owner_id")
            .single();

        if (petError) throw new Error(`Error actualizando mascota: ${petError.message}`);

        // 4. Update Owner (Client)
        if (petData?.owner_id) {
            const { error: clientError } = await supabaseAdmin
                .from("clients")
                .update({
                    full_name: rawData.ownerName,
                    email: rawData.ownerEmail,
                    phone: rawData.ownerPhone,
                    identification_doc: rawData.ownerDoc,
                    address: rawData.ownerAddress,
                })
                .eq("id", petData.owner_id);

            if (clientError) throw new Error(`Error actualizando propietario: ${clientError.message}`);
        }

        // 5. Revalidate
        revalidatePath("/dashboard/patients");
        revalidatePath(`/dashboard/patients/${patientId}`);

        return {
            success: true,
            message: "Perfil del paciente actualizado correctamente."
        };

    } catch (error: any) {
        console.error("Update Error:", error);
        return {
            success: false,
            message: error.message || "Ocurrió un error al actualizar el paciente."
        };
    }
}
