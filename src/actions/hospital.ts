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

export async function addHospitalRound(hospitalizationId: string, data: { evolution: string; treatmentApplied: string; vitals: any; exams?: string[]; inventoryItems?: string }) {
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

    // 2.1 Procesar insumos consumidos
    let items = [];
    if (data.inventoryItems) {
        try {
            items = JSON.parse(data.inventoryItems);
        } catch (e) {
            console.error("Error al parsear insumos de ronda hospitalaria:", e);
        }
    }

    if (items.length > 0) {
        try {
            // Buscar almacén clínico de hospitalización o emergencia con cascada lógica
            const { data: warehouses } = await supabaseAdmin
                .from("warehouses")
                .select("id, name, type")
                .eq("clinic_id", hosp.clinic_id)
                .eq("is_active", true);

            let targetWarehouse = null;
            if (warehouses && warehouses.length > 0) {
                // 1. Intentar buscar almacén específico de hospitalización o emergencia por nombre
                targetWarehouse = warehouses.find(w => 
                    w.name.toLowerCase().includes("hospital") || 
                    w.name.toLowerCase().includes("emergencia")
                );

                // 2. Fallback al primer almacén de consulta ('consulting')
                if (!targetWarehouse) {
                    targetWarehouse = warehouses.find(w => w.type === "consulting");
                }

                // 3. Fallback al Almacén Principal (tipo 'storage' o nombre "principal")
                if (!targetWarehouse) {
                    targetWarehouse = warehouses.find(w => 
                        w.name.toLowerCase().includes("principal") || 
                        w.type === "storage"
                    );
                }

                // 4. Último recurso: primer almacén disponible
                if (!targetWarehouse) {
                    targetWarehouse = warehouses[0];
                }
            }

            for (const item of items) {
                if (!item.product_id || item.quantity <= 0) continue;

                // Log a hospital_round_items
                await supabaseAdmin.from("hospital_round_items").insert({
                    clinic_id: hosp.clinic_id,
                    hospitalization_id: hospitalizationId,
                    round_id: round.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price || 0,
                    total_price: (item.unit_price || 0) * item.quantity
                });

                // Deduct stock (Physical Products only)
                if (item.category !== 'Service' && item.category !== 'Other') {
                    let batchesQuery = supabaseAdmin
                        .from("inventory_batches")
                        .select("*")
                        .eq("product_id", item.product_id)
                        .gt("quantity", 0);

                    if (targetWarehouse) {
                        batchesQuery = batchesQuery.eq("warehouse_id", targetWarehouse.id);
                    }

                    let { data: batches } = await batchesQuery
                        .order("expiry_date", { ascending: true, nullsFirst: false })
                        .order("created_at", { ascending: true });

                    // Fallback a cualquier almacén si no hay en el específico
                    if (!batches || batches.length === 0) {
                        const { data: fallbackBatches } = await supabaseAdmin
                            .from("inventory_batches")
                            .select("*")
                            .eq("product_id", item.product_id)
                            .gt("quantity", 0)
                            .order("expiry_date", { ascending: true, nullsFirst: false })
                            .order("created_at", { ascending: true });
                        batches = fallbackBatches;
                    }

                    if (batches && batches.length > 0) {
                        let remaining = item.quantity;

                        for (const batch of batches) {
                            if (remaining <= 0) break;
                            const take = Math.min(Number(batch.quantity), remaining);

                            // Restar stock
                            await supabaseAdmin
                                .from("inventory_batches")
                                .update({ quantity: Number(batch.quantity) - take })
                                .eq("id", batch.id);

                             // Registrar transacción en el Kardex (inventory_transactions)
                             await supabaseAdmin
                                 .from("inventory_transactions")
                                 .insert({
                                     clinic_id: hosp.clinic_id,
                                     product_id: item.product_id,
                                     batch_id: batch.id,
                                     warehouse_id: batch.warehouse_id,
                                     transaction_type: 'consumption',
                                     quantity: -take,
                                     notes: 'Uso en Hospitalización',
                                     created_by: user.id,
                                     reference_id: hospitalizationId,
                                     reference_type: 'hospitalization'
                                 });

                            remaining -= take;
                        }

                        // Disparar alerta en tiempo real si el stock general cae por debajo del mínimo
                        const { notifyLowStockAlert } = await import("@/actions/notify-low-stock");
                        await notifyLowStockAlert(item.product_id, hosp.clinic_id);
                    }
                }
            }
        } catch (err: any) {
            console.error("Error al registrar consumo en hospitalización:", err);
        }
    }

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
