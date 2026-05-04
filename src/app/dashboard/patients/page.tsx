import { Plus, History, Syringe } from "lucide-react";
import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PatientSearch } from "@/components/dashboard/patients/PatientSearch";
import { PatientListItem } from "@/components/dashboard/patients/PatientListItem";

// Helper to calculate age (simplified) removed - moved to client component

export default async function PatientsPage({
    searchParams,
}: {
    searchParams?: Promise<{
        query?: string;
        page?: string;
    }>;
}) {
    const query = (await searchParams)?.query || "";
    const supabase = await createClient();

    // DEBUG: Check Auth status
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("DEBUG: Current User ID:", user?.id);
    console.log("DEBUG: Auth Error:", authError);

    // Fetch Patients with Owner (Client) Info
    let dbQuery = supabase
        .from("pets")
        .select(`
            *,
            clients (
                full_name,
                phone
            )
        `)
        .order("created_at", { ascending: false });

    // Apply Search Filter (simple text search across multiple fields)
    // Apply Search Filter (simple text search across multiple fields)
    // dbQuery = dbQuery.or(`name.ilike.%${query}%,species.ilike.%${query}%,breed.ilike.%${query}%`);

    const { data: allPatients, error } = await dbQuery;

    // Filter in JS to support searching by nested Owner Name (difficult in simple Supabase queries)
    const patients = query
        ? allPatients?.filter(p =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.species.toLowerCase().includes(query.toLowerCase()) ||
            p.breed?.toLowerCase().includes(query.toLowerCase()) ||
            p.clients?.full_name?.toLowerCase().includes(query.toLowerCase())
        )
        : allPatients;

    if (error) {
        console.error("Error fetching patients:", error);
    }

    return (
        <div className="space-y-6">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-extrabold text-foreground">Pacientes</h1>
                    <p className="text-muted-foreground">Gestiona los expedientes clínicos de tus mascotas.</p>
                </div>
                <Link href="/dashboard/patients/new">
                    <button className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5">
                        <Plus size={20} />
                        Nuevo Paciente
                    </button>
                </Link>
            </div>

            {/* Filters & Search Component */}
            <Suspense fallback={<div className="h-20 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-[2rem]" />}>
                <PatientSearch />
            </Suspense>

            {/* Patients Grid/List */}
            <div className="grid grid-cols-1 gap-4">
                {patients?.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-border/60 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mb-6">
                            <History className="text-primary w-10 h-10 opacity-80" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Aún no hay pacientes</h3>
                        <p className="text-muted-foreground max-w-sm mb-6">Comienza registrando la primera mascota para gestionar su historial médico y citas.</p>
                        <Link href="/dashboard/patients/new">
                            <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                                Registrar Primer Paciente
                            </button>
                        </Link>
                    </div>
                ) : (
                    patients?.map((patient) => (
                        <PatientListItem
                            key={patient.id}
                            patient={patient}
                        />
                    ))
                )}
            </div>

        </div>
    );
}
