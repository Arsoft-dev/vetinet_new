import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, X } from "lucide-react";
import { notFound } from "next/navigation";
import { ConsultationForm } from "@/components/dashboard/patients/ConsultationForm";
import { BackButton } from "@/components/ui/BackButton";

export default async function NewConsultationPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch minimal patient info for Context
    const { data: patient } = await supabase
        .from("pets")
        .select("name, species, is_deceased")
        .eq("id", id)
        .single();

    if (!patient) return notFound();

    if (patient.is_deceased) {
        const { redirect } = await import("next/navigation");
        return redirect(`/dashboard/patients/${id}`);
    }

    // Fetch billing configuration
    const { data: { user } } = await supabase.auth.getUser();
    let billingEnabled = true;

    if (user) {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const supabaseAdmin = createAdminClient();
        const { data: member } = await supabaseAdmin
            .from("clinic_members")
            .select("clinics(billing_enabled)")
            .eq("user_id", user.id)
            .single();
        
        if (member) {
            billingEnabled = (member.clinics as any)?.billing_enabled ?? true;
        }
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">

            {/* Header */}
            <div className="flex items-center gap-4 mb-2">
                <BackButton fallbackUrl={`/dashboard/patients/${id}`} />
                <div>
                    <h1 className="text-2xl font-bold font-heading text-foreground">
                        Nueva Consulta
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {patient.name} ({patient.species})
                    </p>
                </div>
            </div>

            {/* Client Form */}
            <ConsultationForm petId={id} petName={patient.name} billingEnabled={billingEnabled} />

        </div>
    );
}
