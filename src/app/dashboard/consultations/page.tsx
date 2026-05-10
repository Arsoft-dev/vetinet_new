"use server";

import { createClient } from "@/lib/supabase/server";
import { Stethoscope, Search as SearchIcon } from "lucide-react";
import { ConsultationPatientList } from "@/components/dashboard/patients/ConsultationPatientList";

export default async function ConsultationsPage() {
    const supabase = await createClient();

    // Fetch all pets with owner info
    const { data: pets } = await supabase
        .from("pets")
        .select(`
            id,
            name,
            species,
            breed,
            avatar_url,
            clients (
                full_name,
                phone
            )
        `)
        .eq("is_deceased", false)
        .order("name", { ascending: true });

    // Transform data to ensure 'clients' is an object and not an array for TS
    const processedPets = (pets || []).map((pet: any) => ({
        ...pet,
        clients: Array.isArray(pet.clients) ? pet.clients[0] : pet.clients
    }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
                        <Stethoscope className="text-primary" />
                        Módulo de Consultas
                    </h1>
                    <p className="text-sm text-muted-foreground"> Selecciona un paciente para iniciar una nueva atención clínica.</p>
                </div>
            </div>

            {/* List with Search Integration */}
            <ConsultationPatientList initialPets={processedPets as any[]} />
        </div>
    );
}
