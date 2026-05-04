"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { Activity, ArrowLeft, Calendar, FileText, User, Heart, Wind, Thermometer, Plus, CheckCircle } from "lucide-react";
import Link from "next/link";
import { HospitalEvolutionDetail } from "@/components/dashboard/hospital/HospitalEvolutionDetail";

export default async function HospitalDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch Hospitalization details
    const { data: hospital, error } = await supabase
        .from("hospitalizations")
        .select(`
            *,
            pet:pets (
                id,
                name,
                species,
                breed,
                avatar_url,
                owner:clients (
                    full_name,
                    phone
                )
            )
        `)
        .eq("id", id)
        .single();

    if (error || !hospital) {
        return notFound();
    }

    // Fetch Evolution Rounds (Using Admin Client to bypass RLS complex join issue temporarily)
    const supabaseAdmin = createAdminClient();
    const { data: rounds } = await supabaseAdmin
        .from("hospital_rounds")
        .select(`
            *,
            vet:users (
                full_name
            )
        `)
        .eq("hospitalization_id", id)
        .order("round_date", { ascending: false });

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/hospital" className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                    <ArrowLeft size={20} className="text-slate-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
                        Expediente de Hospitalización
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 text-xs font-bold border border-rose-200 uppercase tracking-tighter">
                            Interno
                        </span>
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Seguimiento continuo de <span className="font-bold text-foreground">{hospital.pet?.name}</span>
                    </p>
                </div>
            </div>

            {/* Main Evolution Detail Component */}
            <HospitalEvolutionDetail hospital={hospital} rounds={rounds || []} />
        </div>
    );
}
