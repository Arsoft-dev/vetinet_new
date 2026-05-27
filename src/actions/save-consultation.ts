"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin"; // Use admin for reliable table access
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

interface SaveConsultationState {
    success: boolean;
    message: string;
    errors?: Record<string, string[]>;
}

export async function saveConsultation(
    petId: string,
    prevState: any,
    formData: FormData
): Promise<SaveConsultationState> {
    const supabase = await createClient(); // For getting current user
    const supabaseAdmin = createAdminClient(); // For DB operations

    // 1. Get Current Vet & Clinic
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No estás autenticado.");

    // Find clinic
    const { data: memberData, error: memberError } = await supabaseAdmin
        .from("clinic_members")
        .select("clinic_id")
        .eq("user_id", user.id)
        .single();

    if (memberError || !memberData) throw new Error("No se encontró tu clínica asociada.");
    const clinicId = memberData.clinic_id;

    // 2. Extract FormData
    const rawData = {
        subjective: formData.get("subjective") as string,
        objective: formData.get("objective") as string,
        assessment: formData.get("assessment") as string,
        plan: formData.get("plan") as string,
        reason: formData.get("reason") as string,
        inventoryItems: formData.get("inventoryItems") as string,

        // Basic Vitals
        weight: formData.get("weight") as string,
        temperature: formData.get("temperature") as string,

        // Physical Exam
        respiratory_rate: formData.get("respiratory_rate") as string,
        heart_rate: formData.get("heart_rate") as string,
        pulse: formData.get("pulse") as string,
        tllc: formData.get("tllc") as string,
        lymph_nodes: formData.get("lymph_nodes") as string,
        mucosas: formData.get("mucosas") as string,
        attitude: formData.get("attitude") as string,
        body_condition: formData.get("body_condition") as string,
        hydration_status: formData.get("hydration_status") as string,
        integumentary_system: formData.get("integumentary_system") as string,
        eyes_system: formData.get("eyes_system") as string,
        ears_system: formData.get("ears_system") as string,
        nose_system: formData.get("nose_system") as string,
        digestive_system: formData.get("digestive_system") as string,
        respiratory_system: formData.get("respiratory_system") as string,
        nervous_system: formData.get("nervous_system") as string,
        musculoskeletal_system: formData.get("musculoskeletal_system") as string,
        cardiovascular_system: formData.get("cardiovascular_system") as string,
        genitourinary_system: formData.get("genitourinary_system") as string,
        sendToBilling: formData.get("sendToBilling") === "true",
    };

    try {
        const exams = formData.getAll("exams") as string[];

        // 3. Save to DB (Medical Record)
        const { data: recordData, error: recordError } = await supabaseAdmin
            .from("medical_records")
            .insert({
                clinic_id: clinicId,
                pet_id: petId,
                vet_id: user.id,
                visit_date: new Date().toISOString(),
                reason: rawData.reason,
                subjective: rawData.subjective,
                objective: rawData.objective,
                assessment: rawData.assessment,
                plan: rawData.plan,
                weight_kg: rawData.weight ? parseFloat(rawData.weight) : null,
                temperature_c: rawData.temperature ? parseFloat(rawData.temperature) : null,

                // Physical Exam
                respiratory_rate: rawData.respiratory_rate ? parseFloat(rawData.respiratory_rate) : null,
                heart_rate: rawData.heart_rate ? parseFloat(rawData.heart_rate) : null,
                pulse: rawData.pulse,
                tllc: rawData.tllc,
                lymph_nodes: rawData.lymph_nodes,
                mucosas: rawData.mucosas,
                attitude: rawData.attitude,
                body_condition: rawData.body_condition,
                hydration_status: rawData.hydration_status,
                integumentary_system: rawData.integumentary_system,
                eyes_system: rawData.eyes_system,
                ears_system: rawData.ears_system,
                nose_system: rawData.nose_system,
                digestive_system: rawData.digestive_system,
                respiratory_system: rawData.respiratory_system,
                nervous_system: rawData.nervous_system,
                musculoskeletal_system: rawData.musculoskeletal_system,
                cardiovascular_system: rawData.cardiovascular_system,
                genitourinary_system: rawData.genitourinary_system,
                billing_status: rawData.sendToBilling ? 'pending_payment' : 'unbilled',
            })
            .select()
            .single();

        if (recordError) throw new Error(recordError.message);

        // 4. Create Exam Orders (if any)
        if (exams.length > 0) {
            const examInserts = exams.map(examType => ({
                clinic_id: clinicId,
                pet_id: petId,
                consultation_id: recordData.id,
                type: examType,
                status: "pending"
            }));

            const { error: examsError } = await supabaseAdmin
                .from("exam_orders")
                .insert(examInserts);

            if (examsError) throw new Error(`Error creando órdenes: ${examsError.message}`);
        }

        // 4. Update Pet Weight if provided (Nice to have feature)
        if (rawData.weight) {
            await supabaseAdmin
            await supabaseAdmin
                .from("pets")
                .update({ weight_kg: parseFloat(rawData.weight) })
                .eq("id", petId);
        }

        // 5. PROCESS INVENTORY ITEMS (Consumption) & CONSULTATION FEE
        
        let allItems = [];
        if (rawData.inventoryItems) {
            try {
                allItems = JSON.parse(rawData.inventoryItems);
            } catch (e) {
                console.error("Error parsing inventory items", e);
            }
        }

        // Si se envió a facturación, inyectar el servicio de consulta automáticamente
        if (rawData.sendToBilling) {
            // 1. Buscar si ya existe el servicio de consulta
            let { data: consultService } = await supabaseAdmin
                .from("products")
                .select("*")
                .eq("clinic_id", clinicId)
                .eq("category", "Service")
                .ilike("name", "%Consulta%")
                .limit(1)
                .single();

            // 2. Si no existe, crearlo
            if (!consultService) {
                const { data: newService, error: svcError } = await supabaseAdmin
                    .from("products")
                    .insert({
                        clinic_id: clinicId,
                        name: "Consulta Veterinaria",
                        category: "Service",
                        sale_price: 20, // Precio base por defecto
                        is_archived: false,
                        description: "Servicio de consulta médica veterinaria general."
                    })
                    .select()
                    .single();
                
                if (!svcError && newService) {
                    consultService = newService;
                }
            }

            // 3. Añadirlo a los items a procesar
            if (consultService) {
                allItems.unshift({
                    product_id: consultService.id,
                    quantity: 1,
                    unit_price: consultService.sale_price,
                    category: consultService.category,
                    name: consultService.name
                });
            }
        }

        if (allItems.length > 0) {
            try {
                const items = allItems;

                // Process each item (similar to consumeProduct but in-loop)
                for (const item of items) {
                    if (!item.product_id || item.quantity <= 0) continue;

                    // A. Record Usage (Service or Product)
                    await supabaseAdmin.from("consultation_items").insert({
                        clinic_id: clinicId,
                        medical_record_id: recordData.id,
                        product_id: item.product_id,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        total_price: item.quantity * item.unit_price
                    });

                    // B. Deduct Stock (Physical Products Only)
                    if (item.category !== 'Service' && item.category !== 'Other') {
                        // 1. Buscar almacenes de tipo 'consulting' activos en la clínica
                        const { data: consultingWarehouses } = await supabaseAdmin
                            .from("warehouses")
                            .select("id")
                            .eq("clinic_id", clinicId)
                            .eq("type", "consulting")
                            .eq("is_active", true);

                        let targetWarehouseIds: string[] = [];
                        if (consultingWarehouses && consultingWarehouses.length > 0) {
                            targetWarehouseIds = consultingWarehouses.map(w => w.id);
                        }

                        // 2. Buscar lotes en los almacenes clínicos primero
                        let batchesQuery = supabaseAdmin
                            .from("inventory_batches")
                            .select("*")
                            .eq("product_id", item.product_id)
                            .gt("quantity", 0);

                        if (targetWarehouseIds.length > 0) {
                            batchesQuery = batchesQuery.in("warehouse_id", targetWarehouseIds);
                        }

                        let { data: batches } = await batchesQuery
                            .order("expiry_date", { ascending: true, nullsFirst: false })
                            .order("created_at", { ascending: true });

                        // 3. Fallback inteligente: si no hay existencias en consulta, buscar en cualquier almacén (incluyendo Principal)
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

                                // Update Batch
                                await supabaseAdmin
                                    .from("inventory_batches")
                                    .update({ quantity: Number(batch.quantity) - take })
                                    .eq("id", batch.id);

                                 // Log Kardex transaction
                                 await supabaseAdmin
                                     .from("inventory_transactions")
                                     .insert({
                                         clinic_id: clinicId,
                                         product_id: item.product_id,
                                         batch_id: batch.id,
                                         warehouse_id: batch.warehouse_id,
                                         transaction_type: 'consumption',
                                         quantity: -take,
                                         notes: 'Consumo en Consulta',
                                         created_by: user.id,
                                         reference_id: recordData.id,
                                         reference_type: 'medical_record'
                                     });

                                remaining -= take;
                            }

                            // Disparar alerta en tiempo real
                            const { notifyLowStockAlert } = await import("@/actions/notify-low-stock");
                            await notifyLowStockAlert(item.product_id, clinicId);
                        }
                    }
                }
            } catch (invError: any) {
                console.error("Error processing inventory items:", invError);
                // Non-blocking for now, but ideally we should rollback or alert
            }
        }

    } catch (error: any) {
        console.error("Save Consultation Error:", error);
        return {
            success: false,
            message: error.message || "Error al guardar la consulta."
        };
    }

    // 5. Redirect on Success
    revalidatePath(`/dashboard/patients/${petId}`);
    redirect(`/dashboard/patients/${petId}`);
}
