"use server";

import { createClient } from "@/lib/supabase/server";
import { Pill, Plus, Search } from "lucide-react";
import { TreatmentProtocolsList } from "@/components/dashboard/treatments/TreatmentProtocolsList";

export default async function TreatmentsPage() {
    const supabase = await createClient();

    // Fetch existing protocols
    const { data: protocols } = await supabase
        .from("treatment_protocols")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
                        <Pill className="text-primary" />
                        Protocolos de Tratamiento
                    </h1>
                    <p className="text-sm text-muted-foreground">Crea plantillas de tratamiento para cargar rápidamente en consultas u hospitalizaciones.</p>
                </div>
            </div>

            {/* List and Management Component */}
            <TreatmentProtocolsList initialProtocols={protocols || []} />
        </div>
    );
}
