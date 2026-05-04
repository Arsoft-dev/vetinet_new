import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EditPatientForm } from "@/components/dashboard/patients/EditPatientForm";

export default async function EditPatientPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch Patient & Owner
    const { data: patient, error } = await supabase
        .from("pets")
        .select(`
            *,
            clients (
                full_name,
                email,
                phone,
                identification_doc,
                address
            )
        `)
        .eq("id", id)
        .single();

    if (error || !patient) {
        return notFound();
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">

            {/* Header */}
            <div className="flex items-center gap-4 mb-2">
                <Link href="/dashboard/patients" className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                    <ArrowLeft size={20} className="text-slate-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold font-heading text-foreground">Editar Paciente</h1>
                    <p className="text-sm text-muted-foreground">
                        Actualiza los datos de <span className="font-bold text-foreground">{patient.name}</span>
                    </p>
                </div>
            </div>

            {/* Edit Form */}
            <EditPatientForm data={patient} />

        </div>
    );
}
