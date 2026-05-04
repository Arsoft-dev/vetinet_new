"use server";

import { Suspense } from "react";
import { CalendarView } from "@/components/dashboard/calendar/CalendarView";
import { getAppointments } from "@/actions/appointments";
import { createClient } from "@/lib/supabase/server";
import { CalendarDays } from "lucide-react";

export default async function CalendarPage() {
    const appointments = await getAppointments();
    const supabase = await createClient();
    
    // Fetch pets for appointment creation
    const { data: pets } = await supabase
        .from("pets")
        .select("id, name, species")
        .eq("is_deceased", false)
        .order("name", { ascending: true });

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
                        <CalendarDays className="text-primary" />
                        Agenda Médica
                    </h1>
                    <p className="text-sm text-muted-foreground">Gestiona tus citas y cirugías programadas.</p>
                </div>
            </div>

            {/* Calendar View */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-border/40 dark:border-slate-800 shadow-sm overflow-hidden p-4">
                <Suspense fallback={<div className="h-full flex items-center justify-center">Cargando agenda...</div>}>
                    <CalendarView initialEvents={appointments} pets={pets || []} />
                </Suspense>
            </div>
        </div>
    );
}
