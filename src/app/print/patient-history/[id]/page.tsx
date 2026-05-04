import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PrintTrigger } from "@/components/dashboard/print/PrintTrigger";

export default async function PrintPatientHistoryPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch core Patient, Owner, and Clinic info
    const { data: patient, error } = await supabase
        .from("pets")
        .select(`
            *,
            clients ( full_name, identification_doc, phone ),
            clinics ( name, address, phone, logo_url )
        `)
        .eq("id", id)
        .single();

    if (error || !patient) {
        console.error("Error fetching core patient info:", error?.message || error);
        return notFound();
    }

    // Fetch related records in parallel for performance and safety
    const [
        { data: medical_records },
        { data: hospitalizations },
        { data: vaccinations },
        { data: exam_orders }
    ] = await Promise.all([
        supabase.from("medical_records").select("*").eq("pet_id", id).order("visit_date", { ascending: false }),
        supabase.from("hospitalizations").select("*").eq("pet_id", id).order("entry_date", { ascending: false }),
        supabase.from("vaccinations").select("*").eq("pet_id", id).order("applied_date", { ascending: false }),
        supabase.from("exam_orders").select("*").eq("pet_id", id).eq("status", "completed").order("created_at", { ascending: false })
    ]);

    // Helper for Age
    const getAge = (birthDate: string) => {
        if (!birthDate) return "";
        const years = new Date().getFullYear() - new Date(birthDate).getFullYear();
        return years > 0 ? `${years} años` : "Menos de 1 año";
    };

    const consultations = medical_records || [];
    const hospHistory = hospitalizations || [];
    const vaccines = vaccinations || [];
    const exams = exam_orders || [];

    return (
        <div className="bg-slate-100 dark:bg-slate-950 min-h-screen py-8 print:bg-white print:p-0 transition-colors duration-500">
            <div className="bg-white dark:bg-white text-black dark:text-black p-8 print:p-0 max-w-[21cm] mx-auto font-sans shadow-2xl print:shadow-none min-h-[29.7cm]">
                <PrintTrigger />

            {/* HEADER */}
            <header className="border-b-4 border-primary pb-6 mb-8 flex justify-between items-start">
                <div className="flex items-center gap-6">
                    {/* Logo con fallback a Vetinet Square */}
                    {patient.clinics?.logo_url ? (
                        <img 
                            src={patient.clinics.logo_url} 
                            alt="Logo" 
                            className="w-24 h-24 object-contain"
                        />
                    ) : (
                        <div className="flex flex-col items-center">
                            <img src="/icono.png" alt="Vetinet Icon" className="w-24 h-24 object-contain" />
                            <span className="text-[12px] font-black text-emerald-600 -mt-2 tracking-widest">VETINET</span>
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">
                            {patient.clinics?.name || "Clínica Veterinaria"}
                        </h1>
                        <div className="text-xs text-slate-500 mt-2 space-y-0.5 font-medium">
                            <p>{patient.clinics?.address || "Dirección no registrada"}</p>
                            <p>Tel: {patient.clinics?.phone}</p>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-black text-slate-300 uppercase leading-none">Historia Clínica</h2>
                    <div className="mt-4 text-[10px] font-bold text-slate-400 space-y-1">
                        <p className="uppercase tracking-widest">ID Paciente: {patient.id.slice(0, 8)}</p>
                        <p className="text-slate-900 text-sm">
                            Fecha: {new Date().toLocaleDateString("es-ES", { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
            </header>

            {/* PATIENT INFO */}
            <section className="bg-slate-50 border border-slate-100 rounded-3xl p-6 mb-10 text-sm grid grid-cols-2 gap-8">
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Información del Paciente</h3>
                    <div className="space-y-1">
                        <p className="text-xl font-bold text-slate-800">{patient.name}</p>
                        <p className="text-sm text-slate-500">{patient.species} • {patient.breed}</p>
                        <p className="text-xs text-slate-400 font-medium italic">{getAge(patient.birth_date)} • {patient.sex === 'male' ? 'Macho' : 'Hembra'}</p>
                    </div>
                </div>
                <div className="space-y-3 border-l border-slate-200 pl-8">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Propietario / Responsable</h3>
                    <div className="space-y-1">
                        <p className="text-xl font-bold text-slate-800">{patient.clients?.full_name}</p>
                        <p className="text-sm text-slate-500">Peso Actual: <span className="font-bold text-slate-800">{patient.weight_kg ? `${patient.weight_kg} kg` : "--"}</span></p>
                    </div>
                </div>
            </section>

            <div className="space-y-10">

                {/* CONSULTATIONS */}
                {consultations.length > 0 && (
                    <section>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] border-b-2 border-slate-100 pb-3 mb-6">
                            Registro de Consultas
                        </h3>
                        <div className="space-y-8">
                            {consultations.map((record: any) => (
                                <div key={record.id} className="relative pl-6 border-l-2 border-primary/20 break-inside-avoid">
                                    <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-primary" />
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="text-lg font-black text-slate-800 leading-none">{new Date(record.visit_date).toLocaleDateString("es-ES", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">{record.reason || "Consulta General"}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 mt-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase">Diagnóstico / Evaluación</span>
                                            <p className="text-sm font-bold text-slate-700">{record.assessment || "N/A"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase">Tratamiento Planificado</span>
                                            <p className="text-sm text-slate-600 leading-relaxed italic">{record.plan || "Sin plan registrado."}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* HOSPITALIZATIONS */}
                {hospHistory.length > 0 && (
                    <section>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] border-b-2 border-slate-100 pb-3 mb-6">
                            Hospitalizaciones
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {hospHistory.map((hosp: any) => (
                                <div key={hosp.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm break-inside-avoid">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase">Motivo del Ingreso</span>
                                            <p className="font-bold text-slate-800 leading-tight">{hosp.reason}</p>
                                        </div>
                                        <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full border ${
                                            hosp.exit_date ? 'border-green-200 text-green-600 bg-green-50' : 'border-blue-200 text-blue-600 bg-blue-50'
                                        }`}>
                                            {hosp.exit_date ? 'Alta Médica' : 'En Curso'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-500">
                                        <div>Ingreso: <span className="text-slate-800 font-bold">{new Date(hosp.entry_date).toLocaleDateString()}</span></div>
                                        {hosp.exit_date && <div>Alta: <span className="text-slate-800 font-bold">{new Date(hosp.exit_date).toLocaleDateString()}</span></div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* VACCINES */}
                {vaccines.length > 0 && (
                    <section className="print:break-inside-avoid">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] border-b-2 border-slate-100 pb-3 mb-6">
                            Historial de Vacunación
                        </h3>
                        <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[9px] tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4 border-b border-slate-100">Vacuna</th>
                                        <th className="px-6 py-4 border-b border-slate-100">Aplicación</th>
                                        <th className="px-6 py-4 border-b border-slate-100">Próxima Dosis</th>
                                        <th className="px-6 py-4 border-b border-slate-100">Veterinario</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {vaccines.map((v: any) => (
                                        <tr key={v.id} className="border-b border-slate-50 last:border-none">
                                            <td className="px-6 py-4 font-bold text-slate-800">{v.vaccine_name}</td>
                                            <td className="px-6 py-4 text-slate-600">{new Date(v.applied_date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-slate-800">{v.next_due_date ? new Date(v.next_due_date).toLocaleDateString() : '--'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase italic tracking-tighter">{v.applied_by_name || 'Personal Vetinet'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* EXAMS */}
                {exams.length > 0 && (
                    <section className="print:break-inside-avoid">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] border-b-2 border-slate-100 pb-3 mb-6">
                            Registro de Exámenes y Estudios
                        </h3>
                        <div className="space-y-4">
                            {exams.map((exam: any) => (
                                <div key={exam.id} className="p-3 border border-gray-200 rounded-lg text-sm bg-white">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="font-bold text-gray-800">{exam.type}</p>
                                        <p className="text-xs text-gray-500 font-bold">{new Date(exam.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-gray-700 text-sm mt-1">
                                        {exam.findings ? (
                                            <p><span className="font-bold text-xs uppercase text-gray-400 mr-2">Hallazgos:</span> {exam.findings}</p>
                                        ) : (
                                            <p className="text-gray-400 italic text-xs">Sin hallazgos transcritos</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

            </div>

                {/* FOOTER */}
                <footer className="mt-16 pt-4 border-t border-gray-300 text-xs text-gray-400 text-center">
                    <p>Documento de Historia Clínica generado electrónicamente.</p>
                    <p className="mt-1 uppercase tracking-widest text-[8px]">Software de Gestión Veterinaria VETINET</p>
                </footer>
            </div>
        </div>
    );
}
