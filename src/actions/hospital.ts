"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function admitPet(petId: string, reason: string, initialNotes: string) {
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

    const { error } = await supabaseAdmin
        .from("hospitalizations")
        .insert({
            clinic_id: memberData.clinic_id,
            pet_id: petId,
            reason: reason,
            initial_notes: initialNotes,
            status: 'hospitalized'
        });

    if (error) throw new Error(error.message);
    
    revalidatePath("/dashboard/hospital");
    return { success: true };
}

export async function addHospitalRound(hospitalizationId: string, data: { evolution: string; treatmentApplied: string; vitals: any; exams?: string[] }) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    // 1. Get Hospitalization data to link exams correctly
    const { data: hosp } = await supabaseAdmin
        .from("hospitalizations")
        .select("pet_id, clinic_id")
        .eq("id", hospitalizationId)
        .single();

    if (!hosp) throw new Error("Hospitalización no encontrada");

    // 2. Insert Round
    const { data: round, error } = await supabaseAdmin
        .from("hospital_rounds")
        .insert({
            hospitalization_id: hospitalizationId,
            vet_id: user.id,
            evolution: data.evolution,
            treatment_applied: data.treatmentApplied,
            vitals: data.vitals
        })
        .select()
        .single();

    if (error) throw new Error(error.message);

    // 3. Create Exam Orders if any
    if (data.exams && data.exams.length > 0) {
        const examOrders = data.exams.map(type => ({
            clinic_id: hosp.clinic_id,
            pet_id: hosp.pet_id,
            hospitalization_id: hospitalizationId,
            round_id: round.id,
            type: type,
            status: 'pending'
        }));

        const { error: examError } = await supabaseAdmin
            .from("exam_orders")
            .insert(examOrders);

        if (examError) console.error("Error creating hospital exams:", examError);
    }

    revalidatePath(`/dashboard/hospital/${hospitalizationId}`);
    revalidatePath(`/dashboard/patients/${hosp.pet_id}`);
    
    return { success: true };
}

export async function dischargePet(hospitalizationId: string, totalCost: number) {
    const supabaseAdmin = createAdminClient();
    
    // Obtener datos para el correo de alta
    const { data: hospData } = await supabaseAdmin
        .from("hospitalizations")
        .select(`
            pet:pets (
                name,
                clients (
                    full_name,
                    email
                )
            ),
            clinics (
                name
            )
        `)
        .eq("id", hospitalizationId)
        .single();

    const { error } = await supabaseAdmin
        .from("hospitalizations")
        .update({
            status: 'discharged',
            exit_date: new Date().toISOString(),
            total_cost: totalCost
        })
        .eq("id", hospitalizationId);

    if (error) throw new Error(error.message);

    // Enviar correo de alta
    // @ts-ignore
    if ((hospData as any)?.pet?.clients?.email) {
        (async () => {
            const { sendDischargeEmail } = await import("@/actions/emails");
            await sendDischargeEmail({
                email: (hospData as any).pet.clients.email,
                ownerName: (hospData as any).pet.clients.full_name,
                petName: (hospData as any).pet.name,
                clinicName: (hospData as any).clinics?.name || "Vetinet",
                dischargeNotes: "Su mascota ha completado su tratamiento y está lista para volver a casa. Siga las instrucciones del veterinario para asegurar una recuperación total."
            });
        })().catch(console.error);
    }

    revalidatePath("/dashboard/hospital");
    return { success: true };
}

export async function getHospitalizationReport(hospitalizationId: string) {
    const supabaseAdmin = createAdminClient();

    // 1. Fetch Rounds
    const { data: rounds } = await supabaseAdmin
        .from("hospital_rounds")
        .select(`*, vet:users(full_name)`)
        .eq("hospitalization_id", hospitalizationId)
        .order("created_at", { ascending: true });

    // 2. Fetch Exams
    const { data: exams } = await supabaseAdmin
        .from("exam_orders")
        .select("*")
        .eq("hospitalization_id", hospitalizationId)
        .order("created_at", { ascending: true });

    return {
        rounds: rounds || [],
        exams: exams || []
    };
}
