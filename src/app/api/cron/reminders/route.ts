import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAppointmentReminder } from "@/actions/emails";

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    const supabaseAdmin = createAdminClient();
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const oneHourAndFifteenFromNow = new Date(now.getTime() + 75 * 60 * 1000);

    try {
        // Fetch appointments starting in ~1 hour
        const { data: appointments, error } = await supabaseAdmin
            .from("appointments")
            .select(`
                id,
                start_time,
                clinic_id,
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
            .eq("status", "scheduled")
            .eq("reminder_sent", false)
            .gte("start_time", oneHourFromNow.toISOString())
            .lte("start_time", oneHourAndFifteenFromNow.toISOString());

        if (error) throw error;

        const results = await Promise.all((appointments || []).map(async (app: any) => {
            if (!app.pet?.clients?.email) return { id: app.id, status: 'no_email' };

            const emailResult = await sendAppointmentReminder({
                email: app.pet.clients.email,
                ownerName: app.pet.clients.full_name,
                petName: app.pet.name,
                clinicName: app.clinics?.name || "Vetinet",
                appointmentDate: new Date(app.start_time)
            });

            if (emailResult.success) {
                await supabaseAdmin
                    .from("appointments")
                    .update({ 
                        reminder_sent: true,
                        reminder_sent_at: new Date().toISOString()
                    })
                    .eq("id", app.id);
                return { id: app.id, status: 'sent' };
            }

            return { id: app.id, status: 'error', error: emailResult.error };
        }));

        return NextResponse.json({ 
            processed: appointments?.length || 0,
            results 
        });

    } catch (error: any) {
        console.error("Cron Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
