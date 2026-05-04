
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Bed, Calendar, User, Thermometer, Heart, FlaskConical, ClipboardCheck, Wind } from "lucide-react";
import { notFound } from "next/navigation";

export default async function HospitalizationPrintPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Fetch hospitalization main data
    const { data: hosp } = await supabase
        .from("hospitalizations")
        .select(`*, pet:pets(*, owner:clients(full_name)), clinic:clinics(*)`)
        .eq("id", id)
        .single();

    if (!hosp) return notFound();

    // 2. Fetch Rounds (Using Admin Client to bypass RLS issues)
    const supabaseAdmin = createAdminClient();
    const { data: rounds } = await supabaseAdmin
        .from("hospital_rounds")
        .select(`*, vet:users(full_name)`)
        .eq("hospitalization_id", id)
        .order("created_at", { ascending: true });

    // 3. Fetch Exams
    const { data: exams } = await supabaseAdmin
        .from("exam_orders")
        .select("*")
        .eq("hospitalization_id", id)
        .order("created_at", { ascending: true });

    return (
        <div className="bg-slate-100 dark:bg-slate-950 min-h-screen py-8 print:bg-white print:p-0 transition-colors duration-500">
            <div className="bg-white dark:bg-white text-slate-900 dark:text-slate-900 p-8 print:p-0 max-w-[21cm] mx-auto font-sans shadow-2xl print:shadow-none min-h-[29.7cm] flex flex-col">
                
                {/* HEADER */}
                <header className="border-b-4 border-primary pb-6 mb-8 flex justify-between items-start">
                    <div className="flex items-center gap-6">
                        {/* Logo con fallback a Vetinet Square */}
                        {hosp.clinic?.logo_url ? (
                            <img 
                                src={hosp.clinic.logo_url} 
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
                            <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-2">
                                {hosp.clinic?.name || "Clínica Veterinaria"}
                            </h1>
                            <div className="text-xs text-slate-500 space-y-0.5 font-medium">
                                <p>{hosp.clinic?.address || "Dirección no registrada"}</p>
                                <p>Tel: {hosp.clinic?.phone} • RIF: {hosp.clinic?.rif || "J-00000000-0"}</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-black text-slate-300 uppercase leading-none mb-3">Informe de Hospitalización</h2>
                        <div className="text-[10px] font-bold text-slate-400 space-y-1">
                            <p className="uppercase tracking-widest">ID HOSP: #{hosp.id.slice(0, 8)}</p>
                            <p className="text-slate-900 text-lg uppercase">
                                {new Date(hosp.entry_date).toLocaleDateString("es-ES", { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </header>

                {/* PATIENT & OWNER INFO */}
                <section className="grid grid-cols-2 gap-6 mb-8">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1">Información del Paciente</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="col-span-2">
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Nombre</span>
                                <span className="text-lg font-black text-primary">{hosp.pet?.name}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Especie / Raza</span>
                                <span className="font-bold">{hosp.pet?.species} • {hosp.pet?.breed || "Mestizo"}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Peso Ingreso</span>
                                <span className="font-bold">{hosp.pet?.weight_kg || "--"} kg</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1">Información del Propietario</h3>
                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Responsable</span>
                                <span className="text-lg font-bold text-slate-800">{hosp.pet?.owner?.full_name}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">C.I. / RIF</span>
                                <span className="font-medium text-slate-600">{hosp.pet?.owner_id || "--"}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ADMISSION DETAILS */}
                <div className="grid grid-cols-3 gap-6 mb-10 border-y border-slate-100 py-6 bg-slate-50/30 rounded-xl px-4">
                    <div className="text-center border-r border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Fecha de Ingreso</span>
                        <p className="font-bold text-slate-700">{new Date(hosp.entry_date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-center border-r border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Fecha de Alta</span>
                        <p className="font-bold text-slate-700">{hosp.exit_date ? new Date(hosp.exit_date).toLocaleDateString() : "PENDIENTE / EN CURSO"}</p>
                    </div>
                    <div className="text-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Motivo Principal</span>
                        <p className="font-bold text-slate-700 uppercase">{hosp.reason}</p>
                    </div>
                </div>

                {/* MEDICAL ROUNDS & EVOLUTION */}
                <div className="space-y-8 flex-1 print:mb-8">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] border-b-2 border-slate-100 pb-2 flex items-center gap-2">
                        <ClipboardCheck size={16} className="text-primary" /> Evolución y Tratamientos Aplicados
                    </h3>
                    
                    <div className="space-y-8">
                        {rounds?.map((round, index) => (
                            <div key={round.id} className="relative pl-8 border-l-2 border-slate-100 pb-4 break-inside-avoid">
                                {/* Dot on timeline */}
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-primary"></div>
                                
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-3 bg-slate-50/50 p-2 rounded-lg">
                                    <span className="text-xs font-black text-slate-500 uppercase">
                                        Ronda Médica #{index + 1} — {new Date(round.created_at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 italic">Dr(a). {round.vet?.full_name}</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-2">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Hallazgos y Evolución Clínica</span>
                                        <p className="text-sm text-slate-700 leading-relaxed font-medium">"{round.evolution}"</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black text-primary uppercase tracking-tighter">Plan de Tratamiento / Medicación</span>
                                        <div className="text-sm font-bold text-slate-800 bg-emerald-50/30 p-2 rounded-lg border border-emerald-100/50">
                                            {round.treatment_applied}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex gap-6 pl-2 mt-3 text-xs font-bold text-slate-400 border-t border-slate-50 pt-2">
                                    <div className="flex items-center gap-1.5"><Thermometer size={14} className="text-orange-400" /> {round.vitals?.temp || "--"} °C</div>
                                    <div className="flex items-center gap-1.5"><Heart size={14} className="text-rose-400" /> {round.vitals?.fc || "--"} LPM</div>
                                    {round.vitals?.fr && <div className="flex items-center gap-1.5"><Wind size={14} className="text-blue-400" /> {round.vitals.fr} RPM</div>}
                                </div>
                            </div>
                        ))}

                        {(!rounds || rounds.length === 0) && (
                            <p className="text-center py-10 text-slate-300 italic font-medium">No se han registrado rondas médicas en este periodo.</p>
                        )}
                    </div>

                    {/* Exams Summary */}
                    {exams && exams.length > 0 && (
                        <div className="mt-10 space-y-4 break-inside-avoid">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] border-b-2 border-slate-100 pb-2 flex items-center gap-2">
                                <FlaskConical size={16} className="text-purple-500" /> Estudios y Paraclínicos
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                {exams.map(exam => (
                                    <div key={exam.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-2xl bg-slate-50/30">
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{exam.type}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(exam.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase italic ${
                                            exam.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {exam.status === 'completed' ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* SIGNATURE AREA */}
                <footer className="mt-auto pt-10 border-t-2 border-slate-100 grid grid-cols-2 gap-20 break-inside-avoid">
                    <div className="text-center">
                        <div className="border-b border-slate-300 mb-3 h-12"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Médico Veterinario Tratante</p>
                        <p className="text-sm font-bold text-slate-700">Sello y Firma</p>
                    </div>
                    <div className="text-center">
                        <div className="border-b border-slate-300 mb-3 h-12"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Responsable del Paciente</p>
                        <p className="text-sm font-bold text-slate-700">{hosp.pet?.owner?.full_name}</p>
                    </div>
                </footer>

                <div className="mt-8 text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest break-inside-avoid">
                    Documento generado por Vetinet — Software de Gestión Veterinaria Elite
                </div>
            </div>

            {/* Auto Print Script */}
            <script dangerouslySetInnerHTML={{ __html: 'window.print();' }} />
        </div>
    );
}
