"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getAppointments() {
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

    const { data: appointments } = await supabaseAdmin
        .from("appointments")
        .select(`
            *,
            pet:pets(name, species),
            doctor:users!doctor_id(full_name)
        `)
        .eq("clinic_id", memberData.clinic_id)
        .order("start_time", { ascending: true });

    return appointments || [];
}

export async function createAppointment(formData: any) {
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

    // VALIDATION: Prevent past appointments
    const now = new Date();
    const appStart = new Date(formData.start_time);
    if (appStart < now) {
        throw new Error("No puedes agendar citas en el pasado.");
    }

    // Check for overlaps: (start1 < end2) AND (end1 > start2)
    const { data: overlap } = await supabaseAdmin
        .from("appointments")
        .select("id")
        .eq("clinic_id", memberData.clinic_id)
        .neq("status", "cancelled")
        .lt("start_time", formData.end_time)
        .gt("end_time", formData.start_time)
        .limit(1);

    if (overlap && overlap.length > 0) {
        throw new Error("Ya existe una cita programada en ese horario");
    }

    const { error } = await supabaseAdmin
        .from("appointments")
        .insert({
            clinic_id: memberData.clinic_id,
            pet_id: formData.pet_id || null,
            user_id: user.id, // Creador de la cita
            doctor_id: formData.doctor_id || null,
            start_time: formData.start_time,
            end_time: formData.end_time,
            reason: formData.reason,
            notes: formData.notes,
            status: 'scheduled'
        });

    if (error) throw new Error(error.message);

    // Enviar correo de confirmación de cita
    if (formData.pet_id) {
        (async () => {
            const { data: petInfo } = await supabaseAdmin
                .from("pets")
                .select("name, clients(full_name, email)")
                .eq("id", formData.pet_id)
                .single();
            
            const { data: clinicInfo } = await supabaseAdmin
                .from("clinics")
                .select("name")
                .eq("id", memberData.clinic_id)
                .single();

            // @ts-ignore
            if (petInfo?.clients?.email) {
                const { sendAppointmentEmail } = await import("@/actions/emails");
                await sendAppointmentEmail({
                    // @ts-ignore
                    email: petInfo.clients.email,
                    // @ts-ignore
                    ownerName: petInfo.clients.full_name,
                    petName: petInfo.name,
                    clinicName: clinicInfo?.name || "Vetinet",
                    appointmentDate: new Date(formData.start_time),
                    serviceName: formData.reason || "Consulta General"
                });
            }
        })().catch(console.error);
    }
    
    revalidatePath("/dashboard/calendar");
    return { success: true };
}

export async function updateAppointment(id: string, updates: any) {
    const supabaseAdmin = createAdminClient();
    
    const { data: appointment } = await supabaseAdmin
        .from("appointments")
        .select("*")
        .eq("id", id)
        .single();

    if (!appointment) throw new Error("Cita no encontrada");

    const now = new Date();
    const appStart = new Date(appointment.start_time);

    // 1. Prevent moving appointment to the past
    if (updates.start_time) {
        const newStart = new Date(updates.start_time);
        if (newStart < now) {
            throw new Error("No puedes mover una cita a una fecha pasada.");
        }
    }

    // 2. Prevent setting 'attended' or 'no-show' for future appointments
    if (updates.status && ['attended', 'no_show'].includes(updates.status)) {
        if (appStart > now) {
            throw new Error("No puedes marcar asistencia en una cita que aún no ha ocurrido.");
        }
    }

    const { error } = await supabaseAdmin
        .from("appointments")
        .update(updates)
        .eq("id", id);

    if (error) throw new Error(error.message);
    
    revalidatePath("/dashboard/calendar");
    return { success: true };
}

export async function deleteAppointment(id: string) {
    const supabaseAdmin = createAdminClient();
    
    const { error } = await supabaseAdmin
        .from("appointments")
        .delete()
        .eq("id", id);

    if (error) throw new Error(error.message);
    
    revalidatePath("/dashboard/calendar");
    return { success: true };
}
