import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Basic protection
    if (secret !== 'vetinet123' && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();
    const notificationsToInsert: any[] = [];
    const processedClinics = new Set<string>();

    try {
        // 1. Obtener todas las clínicas activas
        const { data: clinics } = await supabaseAdmin
            .from("clinics")
            .select("id")
            .eq("subscription_status", "active");

        if (!clinics) return NextResponse.json({ success: true, message: "No active clinics" });

        for (const clinic of clinics) {
            processedClinics.add(clinic.id);
            
            // Obtener todos los miembros activos de la clínica a notificar
            const { data: members } = await supabaseAdmin
                .from("clinic_members")
                .select("user_id")
                .eq("clinic_id", clinic.id)
                .eq("status", "active");

            if (!members || members.length === 0) continue;
            const userIds = members.map(m => m.user_id);

            // 2. CHECK LOW STOCK (Ignore Services)
            const { data: products } = await supabaseAdmin
                .from("products")
                .select(`
                    id, name, min_stock_level,
                    batches:inventory_batches(quantity)
                `)
                .eq("clinic_id", clinic.id)
                .eq("is_archived", false)
                .neq("category", "Service")
                .neq("category", "Other");

            if (products) {
                for (const p of products) {
                    const totalStock = p.batches?.reduce((acc: number, b: any) => acc + Number(b.quantity), 0) || 0;
                    if (totalStock <= (p.min_stock_level || 5)) {
                        userIds.forEach(uid => {
                            notificationsToInsert.push({
                                user_id: uid,
                                type: "stock_low",
                                title: "Stock Crítico",
                                message: `El producto "${p.name}" tiene un stock muy bajo (${totalStock} unidades).`
                            });
                        });
                    }
                }
            }

            // 3. CHECK EXPIRING BATCHES
            const in15Days = new Date();
            in15Days.setDate(in15Days.getDate() + 15);
            
            const { data: expiringProducts } = await supabaseAdmin
                .from("products")
                .select(`
                    name, clinic_id, category,
                    batches:inventory_batches!inner(id, quantity, expiry_date)
                `)
                .eq("clinic_id", clinic.id)
                .neq("category", "Service")
                .neq("category", "Other")
                .gt("batches.quantity", 0)
                .lte("batches.expiry_date", in15Days.toISOString().slice(0, 10));

            if (expiringProducts) {
                for (const p of expiringProducts) {
                    for (const b of (p as any).batches) {
                        userIds.forEach(uid => {
                            notificationsToInsert.push({
                                user_id: uid,
                                type: "stock_expiring",
                                title: "Lote por Vencer",
                                message: `Un lote de "${p.name}" (${b.quantity} uds) vence el ${b.expiry_date}.`
                            });
                        });
                    }
                }
            }

            // 4. CHECK TOMORROW'S APPOINTMENTS
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().slice(0, 10);

            const { data: appointments } = await supabaseAdmin
                .from("medical_records")
                .select(`
                    id, scheduled_date, scheduled_time, status,
                    pet:pets(name)
                `)
                .eq("clinic_id", clinic.id)
                .eq("type", "appointment")
                .eq("scheduled_date", tomorrowStr)
                .eq("status", "scheduled");

            if (appointments && appointments.length > 0) {
                userIds.forEach(uid => {
                    notificationsToInsert.push({
                        user_id: uid,
                        type: "appointment",
                        title: "Citas de Mañana",
                        message: `Tienes ${appointments.length} cita(s) agendadas para el día de mañana.`
                    });
                });
            }
        }

        // Insert all notifications in bulk
        if (notificationsToInsert.length > 0) {
            // First we should probably deduplicate or avoid spamming.
            // But for MVP, we just insert. A real system checks if it already notified today.
            const { error } = await supabaseAdmin.from("notifications").insert(notificationsToInsert);
            if (error) throw error;
        }

        return NextResponse.json({ 
            success: true, 
            message: `Robot procesó ${processedClinics.size} clínicas. Se generaron ${notificationsToInsert.length} notificaciones.` 
        });

    } catch (error: any) {
        console.error("Cron Notifications Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
