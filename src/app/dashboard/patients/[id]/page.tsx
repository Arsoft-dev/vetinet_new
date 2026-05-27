import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Calendar, FileText, Activity, Syringe, Skull, Share2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PendingExamsCard } from "@/components/dashboard/patients/PendingExamsCard";
import { VaccineManager } from "@/components/dashboard/patients/VaccineManager";
import { ConsultationHistoryList } from "@/components/dashboard/patients/ConsultationHistoryList";
import { WeightAction } from "@/components/dashboard/patients/WeightAction";
import { HospitalizationHistoryCard } from "@/components/dashboard/patients/HospitalizationHistoryCard";
import { SharePatientAction } from "@/components/dashboard/patients/SharePatientAction";

export default async function PatientDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Fetch Patient & Owner
    const { data: patient, error } = await supabase
        .from("pets")
        .select(`
            *,
            share_token,
            clients (
                id,
                full_name,
                phone,
                email
            )
        `)
        .eq("id", id)
        .single();

    if (error || !patient) {
        return notFound();
    }

    // 2. Fetch Medical History
    const { data: history } = await supabase
        .from("medical_records")
        .select(`
            *,
            vet:users (
                full_name
            )
        `)
        .eq("pet_id", id)
        .order("visit_date", { ascending: false });

    // 3. Fetch Exam Orders
    const { data: rawExams } = await supabase
        .from("exam_orders")
        .select("*")
        .eq("pet_id", id)
        .order("created_at", { ascending: false });

    // 5. Fetch Vaccinations
    const { data: vaccines } = await supabase
        .from("vaccinations")
        .select("*")
        .eq("pet_id", id)
        .order("next_due_date", { ascending: true }); // Show soonest expiring first

    // 6. Fetch Hospitalization History
    const { data: hospitalizations } = await supabase
        .from("hospitalizations")
        .select("*")
        .eq("pet_id", id)
        .order("entry_date", { ascending: false });

    // 4. Generate Signed URLs for Completed Exams
    const examsWithUrls = await Promise.all((rawExams || []).map(async (exam) => {
        if (exam.status === 'completed' && exam.results_url) {
            const { data } = await supabase.storage
                .from('exams')
                .createSignedUrl(exam.results_url, 3600); // Valid for 1 hour
            return { ...exam, signedUrl: data?.signedUrl };
        }
        return exam;
    }));

    const pendingExams = examsWithUrls.filter(e => e.status === "pending");

    return (
        <div className="space-y-6">
            {/* Deceased Banner */}
            {patient.is_deceased && (
                <div className="bg-slate-900 border-l-4 border-slate-700 p-5 rounded-2xl flex items-center justify-between shadow-xl ring-1 ring-white/10 overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-2xl shadow-inner border border-slate-700">
                            ✝️
                        </div>
                        <div>
                            <h3 className="text-white font-bold font-heading uppercase tracking-[0.2em] text-sm">Registro de De funciones</h3>
                            <p className="text-slate-400 text-xs font-medium">Este paciente ha sido marcado como fallecido. Las operaciones activas (Consultas, Vacunas, Hospitalización) han sido bloqueadas.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header / Nav */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/patients" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <ArrowLeft size={20} className="text-slate-500" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black font-heading text-foreground dark:text-slate-100 flex items-center gap-2">
                            {patient.name}
                            <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700 leading-none shadow-sm flex items-center justify-center">
                                {patient.species}
                            </span>
                        </h1>
                        <p className="text-xs text-muted-foreground dark:text-slate-500 font-bold uppercase tracking-widest">
                            Propietario: <span className="text-slate-700 dark:text-slate-300">{patient.clients?.full_name}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <SharePatientAction 
                        token={patient.share_token} 
                        phone={patient.clients?.phone}
                        patientName={patient.name}
                    />
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Patient Profile, Vaccines & Hospitalization */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border/40 dark:border-slate-800 shadow-sm">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-32 h-32 rounded-full bg-slate-100 dark:bg-slate-800 mb-4 flex items-center justify-center text-4xl shadow-inner">
                                {patient.avatar_url ? (
                                    <img src={patient.avatar_url} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <span>{patient.species === "Gato" ? "🐱" : "🐶"}</span>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4 w-full text-left text-sm mt-2">
                                <div>
                                    <span className="block text-muted-foreground text-xs">Raza</span>
                                    <span className="font-medium text-foreground">{patient.breed || "Mestizo"}</span>
                                </div>
                                <div>
                                    <span className="block text-muted-foreground text-xs">Sexo</span>
                                    <span className="font-medium text-foreground capitalize">{patient.sex === 'male' ? "Macho" : "Hembra"}</span>
                                </div>
                                <div>
                                    <span className="block text-muted-foreground text-xs">Peso</span>
                                    <span className="font-medium text-foreground">{patient.weight_kg ? `${patient.weight_kg} kg` : "--"}</span>
                                </div>
                                <div>
                                    <span className="block text-muted-foreground text-xs">Microchip</span>
                                    <span className="font-medium text-foreground">{patient.microchip || "--"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                            <h3 className="font-bold text-sm mb-2">Datos del Cliente</h3>
                            <div className="space-y-2 text-sm">
                                <p className="flex justify-between">
                                    <span className="text-muted-foreground">Nombre:</span>
                                    <span>{patient.clients?.full_name}</span>
                                </p>
                                <p className="flex justify-between">
                                    <span className="text-muted-foreground">Teléfono:</span>
                                    <span>{patient.clients?.phone || "--"}</span>
                                </p>
                                <p className="flex justify-between">
                                    <span className="text-muted-foreground">Email:</span>
                                    <span className="text-xs truncate max-w-[150px]">{patient.clients?.email || "--"}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Vaccine Status Card */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border/40 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                <Syringe size={16} className="text-primary" />
                                Vacunas
                            </h3>
                            {vaccines && vaccines.length > 0 && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Al día</span>}
                        </div>

                        {vaccines && vaccines.length > 0 ? (
                            <div className="space-y-3">
                                {vaccines.map(vac => {
                                    const isExpired = vac.next_due_date && new Date(vac.next_due_date) < new Date();
                                    return (
                                        <div key={vac.id} className="flex justify-between items-start text-sm border-b border-slate-50 dark:border-slate-800/50 pb-2 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-slate-200">{vac.vaccine_name}</p>
                                                <p className="text-xs text-muted-foreground">Aplicada: {new Date(vac.applied_date).toLocaleDateString()}</p>
                                            </div>
                                            {vac.next_due_date && (
                                                <div className="text-right">
                                                    <p className={`text-xs font-bold ${isExpired ? 'text-red-500' : 'text-green-600'}`}>
                                                        {isExpired ? "Venció:" : "Vence:"}
                                                    </p>
                                                    <p className="text-xs text-gray-600">{new Date(vac.next_due_date).toLocaleDateString()}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 border-dashed">
                                <p className="text-xs text-muted-foreground">No hay registro de vacunas.</p>
                            </div>
                        )}
                    </div>

                    {/* Hospitalization History Card (NEW POSITION) */}
                    <HospitalizationHistoryCard history={hospitalizations || []} />
                </div>

                {/* Right Column: Medical History & Actions */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Actions Bar */}
                    {!patient.is_deceased && (
                        <div className="grid grid-cols-2 gap-3 pb-2">
                            <Link href={`/dashboard/patients/${id}/new-consultation`} className="col-span-2">
                                <button className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                                    <FileText size={18} />
                                    Nueva Consulta
                                </button>
                            </Link>

                            <div className="w-full [&>button]:w-full [&>button]:justify-center">
                                <VaccineManager petId={id} />
                            </div>
                            <div className="w-full [&>button]:w-full [&>button]:justify-center">
                                <WeightAction petId={id} currentWeight={patient.weight_kg} />
                            </div>
                        </div>
                    )}

                    {/* Pending Exams Alert */}
                    <PendingExamsCard exams={examsWithUrls || []} clinicId={patient.clinic_id} />

                    {/* History Timeline */}
                    <ConsultationHistoryList
                        history={history || []}
                        examsWithUrls={examsWithUrls || []}
                    />

                </div>
            </div>
        </div>
    );
}
