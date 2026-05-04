"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server"; // Use server client to get current session
import { revalidatePath } from "next/cache";

interface RegisterPatientState {
    success: boolean;
    message: string;
    errors?: Record<string, string[]>;
}

export async function registerPatient(prevState: any, formData: FormData): Promise<RegisterPatientState> {
    const supabaseAdmin = createAdminClient();
    const supabase = await createClient(); // For getting current user

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
        color: formData.get("color") as string,

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
    };

    try {
        // 2. Identify Tenant (Clinic)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No estás autenticado.");

        // Find which clinic this vet belongs to
        const { data: memberData, error: memberError } = await supabaseAdmin
            .from("clinic_members")
            .select("clinic_id")
            .eq("user_id", user.id)
            .single();

        if (memberError || !memberData) throw new Error("No se encontró tu clínica asociada.");
        const clinicId = memberData.clinic_id;

        // 3. Create/Find Client (Owner)
        // Check if client exists in THIS clinic by email (or doc in future)
        let ownerId: string | undefined;

        const { data: existingClient } = await supabaseAdmin
            .from("clients")
            .select("id")
            .eq("clinic_id", clinicId)
            .eq("email", rawData.ownerEmail)
            .single();

        if (existingClient) {
            ownerId = existingClient.id;
        } else {
            // Create new Client
            const { data: newClient, error: clientError } = await supabaseAdmin
                .from("clients")
                .insert({
                    clinic_id: clinicId,
                    full_name: rawData.ownerName,
                    email: rawData.ownerEmail,
                    phone: rawData.ownerPhone,
                    identification_doc: rawData.ownerDoc,
                    address: rawData.ownerAddress,
                })
                .select()
                .single();

            if (clientError) throw new Error(`Error registrando cliente: ${clientError.message}`);
            ownerId = newClient.id;
        }

        // 4. Create Pet
        const { error: petError } = await supabaseAdmin
            .from("pets")
            .insert({
                clinic_id: clinicId,
                owner_id: ownerId,
                name: rawData.petName,
                species: rawData.species,
                breed: rawData.breed,
                birth_date: rawData.birthDate || null,
                weight_kg: rawData.weight ? parseFloat(rawData.weight) : null,
                sex: rawData.sex,
                is_neutered: rawData.isNeutered,
                color: rawData.color,

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
            });

        if (petError) throw new Error(`Error registrando mascota: ${petError.message}`);

        // 5. Send Welcome Email
        if (rawData.ownerEmail) {
            // Fetch Clinic Name for the email
            const { data: clinicData } = await supabaseAdmin
                .from("clinics")
                .select("name")
                .eq("id", clinicId)
                .single();
            
            const clinicName = clinicData?.name || "Vetinet";

            // Fire and forget (don't block the main registration flow)
            import("@/actions/emails").then(({ sendWelcomeEmail }) => {
                sendWelcomeEmail({
                    email: rawData.ownerEmail,
                    ownerName: rawData.ownerName,
                    petName: rawData.petName,
                    clinicName: clinicName
                }).catch(e => console.error("Error sending welcome email:", e));
            });
        }

        // 6. Revalidate
        revalidatePath("/dashboard/patients");

        return {
            success: true,
            message: existingClient
                ? `Paciente registrado (Cliente existente: ${rawData.ownerName}).`
                : `Paciente y Cliente nuevos registrados exitosamente.`
        };

    } catch (error: any) {
        console.error("Registration Error:", error);
        return {
            success: false,
            message: error.message || "Ocurrió un error al registrar el paciente."
        };
    }
}
