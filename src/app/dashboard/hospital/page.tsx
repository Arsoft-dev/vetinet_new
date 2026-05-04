"use server";

import { createClient } from "@/lib/supabase/server";
import { Activity, Plus, Bed, Search, Calendar, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { HospitalPetList } from "@/components/dashboard/hospital/HospitalPetList";

export default async function HospitalPage() {
    const supabase = await createClient();

    // Fetch all currently hospitalized pets
    const { data: hospitalized } = await supabase
        .from("hospitalizations")
        .select(`
            id,
            entry_date,
            status,
            reason,
            pet:pets (
                id,
                name,
                species,
                breed,
                avatar_url,
                owner:clients (
                    full_name
                )
            )
        `)
        .eq("status", "hospitalized")
        .order("entry_date", { ascending: false });

    // Fetch all pets for admission modal
    const { data: allPets } = await supabase
        .from("pets")
        .select("id, name, species, owner:clients(full_name)")
        .eq("is_deceased", false)
        .order("name", { ascending: true });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
                        <Activity className="text-primary" />
                        Módulo de Hospitalización
                    </h1>
                    <p className="text-sm text-muted-foreground">Pacientes internos, rondas médicas y control de evolución.</p>
                </div>
            </div>

            {/* Main Content Component */}
            <HospitalPetList initialHospitalized={hospitalized || []} allPets={allPets || []} />
        </div>
    );
}
