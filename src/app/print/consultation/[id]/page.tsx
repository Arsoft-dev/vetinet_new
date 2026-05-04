import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PrintTrigger } from "@/components/dashboard/print/PrintTrigger";

export default async function PrintConsultationPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Fetch Consultation with all relations
    const { data: record, error } = await supabase
        .from("medical_records")
        .select(`
            *,
            vet:users ( full_name ),
            clinic:clinics ( name, address, phone, logo_url, email:settings->>'email' ), 
            patient:pets (
                name, species, breed, sex, birth_date,
                owner:clients ( full_name, identification_doc )
            ),
            exams:exam_orders(*)
        `)
        .eq("id", id)
        .single();

    if (error || !record) {
        return notFound();
    }

    // Helper for Age
    const getAge = (birthDate: string) => {
        if (!birthDate) return "";
        const years = new Date().getFullYear() - new Date(birthDate).getFullYear();
        return years > 0 ? `${years} años` : "Menos de 1 año";
    };

    return (
        <div className="bg-slate-100 dark:bg-slate-950 min-h-screen py-8 print:bg-white print:p-0 transition-colors duration-500">
            <div className="bg-white dark:bg-white text-black dark:text-black p-8 print:p-0 max-w-[21cm] mx-auto font-sans shadow-2xl print:shadow-none min-h-[29.7cm] flex flex-col">
                <PrintTrigger />

                {/* HEADER */}
                <header className="border-b-4 border-primary pb-6 mb-8 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        {/* Logo con fallback a Vetinet Square */}
                        {record.clinic?.logo_url ? (
                            <img 
                                src={record.clinic.logo_url} 
                                alt="Logo" 
                                className="w-20 h-20 object-contain"
                            />
                        ) : (
                            <div className="flex flex-col items-center">
                                <img src="/icono.png" alt="Vetinet Icon" className="w-20 h-20 object-contain" />
                                <span className="text-[10px] font-black text-emerald-600 -mt-1 tracking-widest">VETINET</span>
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">
                                {record.clinic?.name || "Clínica Veterinaria"}
                            </h1>
                            <div className="text-xs text-slate-500 mt-2 space-y-0.5 font-medium">
                                <p>{record.clinic?.address || "Dirección no registrada"}</p>
                                <p>Tel: {record.clinic?.phone}</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-black text-slate-300 uppercase leading-none">Recetario / Historia</h2>
                        <div className="mt-4 text-[10px] font-bold text-slate-400 space-y-1">
                            <p className="uppercase tracking-widest">Folio: #{record.id.slice(0, 8)}</p>
                            <p className="text-slate-900 text-lg">
                                {new Date(record.visit_date).toLocaleDateString("es-ES", { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </header>

                {/* PATIENT INFO */}
                <section className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-sm grid grid-cols-2 gap-y-2">
                    <div>
                        <span className="font-bold text-gray-500 uppercase text-xs block">Paciente</span>
                        <span className="text-lg font-bold">{record.patient.name}</span>
                        <span className="text-gray-600 ml-2">({record.patient.species} - {record.patient.breed})</span>
                    </div>
                    <div>
                        <span className="font-bold text-gray-500 uppercase text-xs block">Propietario</span>
                        <span className="text-lg font-medium">{record.patient.owner?.full_name}</span>
                    </div>
                    <div>
                        <span className="font-bold text-gray-500 uppercase text-xs block">Edad / Sexo</span>
                        <span>{getAge(record.patient.birth_date)} • {record.patient.sex === 'male' ? 'Macho' : 'Hembra'}</span>
                    </div>
                    <div>
                        <span className="font-bold text-gray-500 uppercase text-xs block">Vínculos Vitales (Peso / Temp / FC / FR)</span>
                        <span className="font-medium">
                            {record.weight_kg ? `${record.weight_kg} kg` : "--"}
                            {' / '}
                            {record.temperature_c ? `${record.temperature_c} °C` : "--"}
                            {' / '}
                            {record.heart_rate ? `${record.heart_rate} lpm` : "--"}
                            {' / '}
                            {record.respiratory_rate ? `${record.respiratory_rate} rpm` : "--"}
                        </span>
                    </div>
                </section>

                {/* MEDICAL CONTENT */}
                <div className="space-y-6 flex-1">

                    {/* Diagnosis */}
                    <div className="mb-6">
                        <h3 className="font-bold border-b border-gray-300 pb-1 mb-2 uppercase text-sm">Diagnóstico</h3>
                        <p className="text-lg font-medium text-gray-800">{record.assessment || "Consulta General"}</p>
                    </div>

                    {/* RX / PLAN (The most important part) */}
                    <div className="break-inside-avoid">
                        <h3 className="font-bold border-b border-gray-300 pb-1 mb-4 uppercase text-sm flex justify-between">
                            <span>Indicaciones y Tratamiento (Rx)</span>
                            <span className="text-xs font-normal text-gray-400">Dr(a). {record.vet?.full_name}</span>
                        </h3>
                        <div className="whitespace-pre-wrap text-base leading-relaxed font-medium text-gray-900 font-serif">
                            {record.plan || "Sin indicaciones específicas."}
                        </div>
                    </div>

                    {/* Exams / Results */}
                    {record.exams && record.exams.length > 0 && (
                        <div className="mt-8 pt-4 border-t-2 border-slate-100">
                            <h3 className="font-bold uppercase text-sm mb-4 text-slate-400 tracking-widest">Resultados de Exámenes</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {record.exams.filter((e: any) => e.status === 'completed').map((exam: any) => (
                                    <div key={exam.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="font-bold text-slate-800">{exam.type}</p>
                                            <span className="text-[10px] font-black text-green-600 uppercase italic">Completado</span>
                                        </div>
                                        {exam.findings ? (
                                            <p className="text-sm text-slate-600 font-medium">
                                                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1 tracking-tighter">Hallazgos:</span>
                                                {exam.findings}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-slate-400 italic">Archivo cargado en sistema.</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Additional Notes (Anamnesis summary) - Optional, maybe smaller */}
                    {record.subjective && (
                        <div className="mt-8 pt-4 border-t border-gray-100">
                            <h4 className="font-bold text-xs text-gray-400 uppercase mb-1">Nota Clínica (Resumen)</h4>
                            <p className="text-sm text-gray-500 italic">{record.subjective}</p>
                        </div>
                    )}

                </div>

                {/* FOOTER / SIGNATURE */}
                <footer className="mt-12">
                    <div className="flex justify-between items-end">
                        <div className="text-xs text-gray-400 max-w-[60%]">
                            <p>Documento generado electrónicamente por <strong>Vetinet</strong>.</p>
                            <p>Consulte a su veterinario ante cualquier duda sobre este tratamiento.</p>
                        </div>
                        <div className="text-center">
                            <div className="w-48 border-b border-black mb-2"></div>
                            <p className="font-bold text-sm">Dr(a). {record.vet?.full_name}</p>
                            <p className="text-xs text-gray-500">Médico Veterinario</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
