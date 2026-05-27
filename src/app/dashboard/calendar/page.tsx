"use server";

import { Suspense } from "react";
import { CalendarView } from "@/components/dashboard/calendar/CalendarView";
import { getAppointments } from "@/actions/appointments";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CalendarDays } from "lucide-react";

export default async function CalendarPage() {
    let appointments = await getAppointments();
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fetch pets for appointment creation
    const { data: pets } = await supabase
        .from("pets")
        .select("id, name, species")
        .eq("is_deceased", false)
        .order("name", { ascending: true });

    // Fetch user role
    let userRole = 'staff';
    let clinicId = null;
    if (user) {
        const { data: member } = await supabaseAdmin
            .from("clinic_members")
            .select("role, clinic_id")
            .eq("user_id", user.id)
            .single();
        if (member) {
            userRole = member.role;
            clinicId = member.clinic_id;
        }
    }

    // Filter appointments for veterinarians (Automatic Role Filter)
    if (userRole === 'vet' && user) {
        appointments = appointments.filter((app: any) => app.doctor_id === user.id);
    }

    // Fetch all veterinarians for the clinic
    let vets: any[] = [];
    if (clinicId) {
        const { data: clinicVets } = await supabaseAdmin
            .from("clinic_members")
            .select("user_id, role, users!inner(full_name)")
            .eq("clinic_id", clinicId)
            .in("role", ["vet", "veterinarian"]);
        
        if (clinicVets) {
            vets = clinicVets.map(v => ({
                id: v.user_id,
                // @ts-ignore
                name: v.users?.full_name || 'Veterinario'
            }));
        }
    }

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
                    <CalendarView 
                        initialEvents={appointments} 
                        pets={pets || []} 
                        vets={vets}
                        userRole={userRole}
                        currentUserId={user?.id || ''}
                    />
                </Suspense>
            </div>
        </div>
    );
}
