import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const supabase = createAdminClient();
        
        // Citas que ocurrirán en los próximos 15 a 20 minutos
        // Ejecutamos este cron cada 5 minutos. 
        // Ventana actual: (now + 15 min) hasta (now + 20 min)
        const now = new Date();
        const minTime = new Date(now.getTime() + 15 * 60000);
        const maxTime = new Date(now.getTime() + 20 * 60000);

        const { data: upcomingAppointments, error } = await supabase
            .from("appointments")
            .select(`
                id, 
                clinic_id, 
                pet:pets(name), 
                doctor_id, 
                reason, 
                start_time
            `)
            .eq("status", "scheduled")
            .gte("start_time", minTime.toISOString())
            .lt("start_time", maxTime.toISOString());

        if (error) {
            console.error("Cron Appointments: Error fetching appointments", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        if (!upcomingAppointments || upcomingAppointments.length === 0) {
            return NextResponse.json({ success: true, message: "No upcoming appointments." });
        }

        const notifications = [];

        for (const app of upcomingAppointments) {
            const petName = (app.pet as any)?.name || 'Mascota';
            const title = "🕒 Recordatorio de Cita";
            const message = `La cita para ${petName} (${app.reason}) comenzará en 15 minutos.`;

            if (app.doctor_id) {
                // Notificar al médico asignado
                notifications.push({
                    clinic_id: app.clinic_id,
                    user_id: app.doctor_id,
                    title,
                    message,
                    type: "appointment",
                    read: false
                });
            } else {
                // Si no hay médico asignado, notificar a recepción / admin
                const { data: staff } = await supabase
                    .from("clinic_members")
                    .select("user_id")
                    .eq("clinic_id", app.clinic_id)
                    .in("role", ["admin", "manager", "receptionist"])
                    .eq("status", "active");

                if (staff) {
                    for (const member of staff) {
                        notifications.push({
                            clinic_id: app.clinic_id,
                            user_id: member.user_id,
                            title,
                            message,
                            type: "appointment",
                            read: false
                        });
                    }
                }
            }
        }

        if (notifications.length > 0) {
            const { error: insertError } = await supabase.from("notifications").insert(notifications);
            if (insertError) {
                console.error("Cron Appointments: Error inserting notifications", insertError);
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Processed ${upcomingAppointments.length} appointments`, 
            notifications_sent: notifications.length 
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
