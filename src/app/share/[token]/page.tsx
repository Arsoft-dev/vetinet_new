import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { 
    Calendar, Syringe, Activity, FileText, MapPin, Phone, Mail, 
    ChevronRight, BadgeCheck, Clock, Download, MessageCircle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function OwnerPortalPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    const supabase = createAdminClient();

    // 1. Fetch Patient via token
    const { data: patient, error: patientError } = await supabase
        .from("pets")
        .select(`
            *,
            clients (
                full_name,
                phone,
                email
            ),
            clinics (
                name,
                logo_url,
                phone,
                address,
                email_contact,
                tax_id,
                communication_settings,
                settings
            )
        `)
        .eq("share_token", token)
        .single();

    if (patientError || !patient) return notFound();

    // 2. Fetch History
    const { data: history } = await supabase
        .from("medical_records")
        .select(`
            *,
            vet:users (full_name)
        `)
        .eq("pet_id", patient.id)
        .order("visit_date", { ascending: false });

    // 3. Fetch Vaccinations
    const { data: vaccines } = await supabase
        .from("vaccinations")
        .select("*")
        .eq("pet_id", patient.id)
        .order("next_due_date", { ascending: true });

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-20">
            
            {/* Clinic Header */}
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 px-6 py-4">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {patient.clinics?.logo_url ? (
                            <img src={patient.clinics.logo_url} className="h-10 w-10 object-contain rounded-xl" alt={patient.clinics.name} />
                        ) : (
                            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                <Activity size={20} />
                            </div>
                        )}
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Portal del Dueño</p>
                            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{patient.clinics?.name}</h2>
                        </div>
                    </div>
                    <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800 flex items-center gap-1.5">
                        <BadgeCheck size={14} />
                        Verificado
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-slate-900 dark:bg-slate-900 text-white pt-16 pb-32 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px]" />
                </div>
                
                <div className="max-w-3xl mx-auto px-6 relative z-10 text-center">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-white p-1.5 mx-auto mb-6 shadow-2xl rotate-3">
                        {patient.avatar_url ? (
                            <img src={patient.avatar_url} className="w-full h-full rounded-[2rem] object-cover" alt={patient.name} />
                        ) : (
                            <div className="w-full h-full rounded-[2rem] bg-slate-100 flex items-center justify-center text-5xl">
                                {patient.species === 'Gato' ? '🐱' : '🐶'}
                            </div>
                        )}
                    </div>
                    <h1 className="text-4xl font-black mb-2 tracking-tight">{patient.name}</h1>
                    <div className="flex items-center justify-center gap-4 text-slate-400 font-bold uppercase text-xs tracking-widest">
                        <span>{patient.breed || 'Mestizo'}</span>
                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                        <span>{patient.sex === 'male' ? 'Macho' : 'Hembra'}</span>
                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                        <span>{patient.weight_kg ? `${patient.weight_kg} kg` : 'S/P'}</span>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-6 -mt-16 relative z-20 space-y-8">
                
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Última Visita</p>
                        <p className="font-black text-slate-800 dark:text-slate-100">
                            {history && history[0] ? format(new Date(history[0].visit_date), 'dd MMM yyyy', { locale: es }) : '--'}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Estatus Vacunas</p>
                        <p className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                            <BadgeCheck size={18} />
                            Al Día
                        </p>
                    </div>
                </div>

                {/* History Section */}
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
                                <FileText size={22} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Historial Médico</h3>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                        {history && history.length > 0 ? history.map((record) => (
                            <div key={record.id} className="p-8 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                                            {format(new Date(record.visit_date), "EEEE, d 'de' MMMM", { locale: es })}
                                        </p>
                                        <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">{record.reason}</h4>
                                    </div>
                                    <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                        Consulta
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Observaciones</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                            {record.clinical_signs || 'Sin observaciones registradas.'}
                                        </p>
                                    </div>
                                    {record.diagnosis && (
                                        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Diagnóstico</p>
                                            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{record.diagnosis}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div className="p-20 text-center text-slate-300">
                                <Clock size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="font-bold uppercase tracking-widest text-xs">Aún no hay registros</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Vaccines Section */}
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-2xl">
                            <Syringe size={22} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Plan Sanitario</h3>
                    </div>

                    <div className="space-y-4">
                        {vaccines && vaccines.length > 0 ? vaccines.map(v => (
                            <div key={v.id} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-700">
                                <div>
                                    <p className="font-black text-slate-800 dark:text-slate-100 tracking-tight">{v.vaccine_name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Aplicada: {format(new Date(v.applied_date), 'dd/MM/yyyy')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Próxima</p>
                                    <p className="text-sm font-black text-slate-700 dark:text-slate-200 italic">{v.next_due_date ? format(new Date(v.next_due_date), 'MMM yyyy', { locale: es }) : '--'}</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-slate-400 text-sm italic">No hay vacunas registradas.</p>
                        )}
                    </div>
                </div>

                {/* Clinic Contact Section */}
                <div className="bg-slate-900 text-white rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <MapPin size={120} />
                    </div>
                    <h3 className="text-2xl font-black mb-6 tracking-tight italic">¿Necesitas una cita?</h3>
                    <div className="space-y-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                                <Phone size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Llámanos</p>
                                <p className="font-black text-lg">{patient.clinics?.settings?.appointment_phone || patient.clinics?.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                                <MapPin size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dirección</p>
                                <p className="font-medium text-slate-300 text-sm leading-snug">{patient.clinics?.address}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-8 grid grid-cols-2 gap-3 relative z-10">
                        {(patient.clinics?.settings?.appointment_whatsapp || patient.clinics?.phone) && (
                            <a 
                                href={`https://wa.me/${(patient.clinics?.settings?.appointment_whatsapp || patient.clinics.phone).replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, me gustaría agendar una cita para mi mascota ${patient.name}.`)}`}
                                target="_blank"
                                className="flex items-center justify-center gap-2 py-4 bg-emerald-500 text-white rounded-[1.5rem] font-black uppercase tracking-wider text-[10px] hover:bg-emerald-400 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                            >
                                <MessageCircle size={18} />
                                WhatsApp
                            </a>
                        )}
                        {(patient.clinics?.settings?.appointment_phone || patient.clinics?.phone) && (
                            <a 
                                href={`tel:${patient.clinics?.settings?.appointment_phone || patient.clinics.phone}`}
                                className="flex items-center justify-center gap-2 py-4 bg-white text-slate-900 rounded-[1.5rem] font-black uppercase tracking-wider text-[10px] hover:bg-slate-100 active:scale-95 transition-all shadow-lg shadow-white/10"
                            >
                                <Phone size={18} />
                                Llamar
                            </a>
                        )}
                    </div>
                </div>

                {/* Footer Logo */}
                <div className="text-center pt-10 pb-4">
                    <img src="/icono.png" className="h-14 mx-auto drop-shadow-md" alt="Vetinet" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-4 text-slate-500 dark:text-slate-400">Tecnología y Seguridad por Vetinet</p>
                </div>
            </main>
        </div>
    );
}
