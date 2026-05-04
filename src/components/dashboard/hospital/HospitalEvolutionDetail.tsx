"use client";

import { useState, useTransition } from "react";
import { Activity, Clock, FileText, Heart, Thermometer, Wind, Plus, CheckCircle, Trash2, ArrowRight, User, Stethoscope, ClipboardCheck, LayoutGrid, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { addHospitalRound, dischargePet } from "@/actions/hospital";

import { Drawer } from "vaul";
import { useMediaQuery } from "@/hooks/use-media-query";

interface Round {
    id: string;
    round_date: string;
    evolution: string;
    treatment_applied: string;
    vitals: any;
    vet: {
        full_name: string;
    } | null;
}

interface HospitalEvolutionDetailProps {
    hospital: any;
    rounds: Round[];
}

export function HospitalEvolutionDetail({ hospital, rounds }: HospitalEvolutionDetailProps) {
    const [isRoundModalOpen, setIsRoundModalOpen] = useState(false);
    const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const handleAddRound = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        const data = {
            evolution: formData.get("evolution") as string,
            treatmentApplied: formData.get("treatmentApplied") as string,
            vitals: {
                temp: formData.get("temp") as string,
                fc: formData.get("fc") as string,
                fr: formData.get("fr") as string,
            },
            exams: formData.getAll("exams") as string[]
        };

        startTransition(async () => {
            try {
                await addHospitalRound(hospital.id, data);
                toast.success("Ronda médica registrada");
                setIsRoundModalOpen(false);
            } catch (error: any) {
                toast.error(error.message);
            }
        });
    };

    const handleDischarge = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        startTransition(async () => {
            try {
                await dischargePet(hospital.id, 0);
                toast.success("Paciente dado de alta con éxito");
                // Open report in a new tab for printing
                window.open(`/print/hospitalization/${hospital.id}`, '_blank');
                window.location.href = "/dashboard/hospital";
            } catch (error: any) {
                toast.error(error.message);
            }
        });
    };

    const RoundFormContent = (
        <form onSubmit={handleAddRound} className="p-6 space-y-6">
            <div className="grid grid-cols-3 gap-6">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">Temp (°C)</label>
                    <input name="temp" type="number" step="0.1" placeholder="38.5" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 text-foreground" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">FC (lpm)</label>
                    <input name="fc" type="number" placeholder="80" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 text-foreground" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">FR (rpm)</label>
                    <input name="fr" type="number" placeholder="24" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 text-foreground" />
                </div>
            </div>
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Evolución Clínica</label>
                <textarea name="evolution" rows={3} placeholder="Describe el estado actual del paciente..." required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/10 resize-none text-foreground" />
            </div>
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tratamiento Aplicado</label>
                <textarea name="treatmentApplied" rows={2} placeholder="Medicamentos, nebulizaciones, etc." required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/10 resize-none text-foreground" />
            </div>

            <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-2">
                    🧪 Órdenes Médicas (Opcional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {["Hematología", "Bioquímica Sanguínea", "Urianálisis", "Coprológico", "Rayos X", "Ecografía Abdominal"].map((exam) => (
                        <label key={exam} className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                            <input type="checkbox" name="exams" value={exam} className="w-4 h-4 text-primary rounded border-slate-300 dark:border-slate-600" />
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate">{exam}</span>
                        </label>
                    ))}
                </div>
            </div>
            <button type="submit" disabled={isPending} className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
                {isPending ? "Registrando..." : <><Plus size={20} /> Guardar Ronda</>}
            </button>
        </form>
    );

    const DischargeContent = (
        <form onSubmit={handleDischarge} className="p-8 space-y-6 text-center">
            <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-[2.5rem] flex items-center justify-center mx-auto text-green-600 border-4 border-white dark:border-slate-900 shadow-xl">
                <Heart size={40} />
            </div>
            <div className="space-y-2">
                <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100">¿Finalizar Hospitalización?</h4>
                <p className="text-slate-500 text-sm">El paciente será marcado como dado de alta y se generará el reporte clínico final.</p>
            </div>

            <button type="submit" disabled={isPending} className="w-full py-5 bg-green-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-green-200 hover:bg-green-700 transition-all flex items-center justify-center gap-3">
                {isPending ? "Procesando..." : <>Efectuar Alta Médica <ArrowRight size={18} /></>}
            </button>
            <button type="button" onClick={() => setIsDischargeModalOpen(false)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Cancelar</button>
        </form>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Summary & Quick Info */}
            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-border/40 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-24 h-24 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex items-center justify-center text-4xl shadow-inner mb-4 overflow-hidden">
                            {hospital.pet?.avatar_url ? (
                                <img src={hospital.pet.avatar_url} className="w-full h-full object-cover" alt={hospital.pet.name} />
                            ) : (
                                <span>{hospital.pet.species === "Gato" ? "🐱" : "🐶"}</span>
                            )}
                        </div>
                        <h2 className="text-2xl font-bold dark:text-slate-100">{hospital.pet?.name}</h2>
                        <p className="text-sm text-muted-foreground">{hospital.pet?.breed}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-50 dark:border-slate-800 space-y-3">
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                            <span className="text-xs font-bold text-slate-400 uppercase">Propietario</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{hospital.pet?.owner?.full_name}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                            <span className="text-xs font-bold text-slate-400 uppercase">Ingreso</span>
                            <span suppressHydrationWarning className="text-xs font-bold text-slate-700 dark:text-slate-200">{new Date(hospital.entry_date).toLocaleDateString()}</span>
                        </div>
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                            <span className="text-[10px] font-black text-rose-400 uppercase block mb-1">Motivo de Ingreso</span>
                            <p className="text-xs font-bold text-rose-700 dark:text-rose-400">{hospital.reason}</p>
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col gap-3">
                        <button
                            onClick={() => setIsRoundModalOpen(true)}
                            className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 shadow-lg shadow-primary/10 transition-all"
                        >
                            <Plus size={20} /> Nueva Ronda
                        </button>
                        <button
                            onClick={() => setIsDischargeModalOpen(true)}
                            className="w-full py-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-100 dark:hover:bg-green-900/40 transition-all"
                        >
                            <CheckCircle size={20} /> Dar de Alta
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Column: Timeline of Evolution */}
            <div className="lg:col-span-2 space-y-4">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-border/40 dark:border-slate-800 shadow-sm min-h-[600px]">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-8 uppercase tracking-widest text-slate-400">
                        <Activity size={20} className="text-primary" /> Historial de Evolución
                    </h3>

                    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
                        {rounds.map((round) => (
                            <div key={round.id} className="relative flex items-start gap-6 pl-12 group">
                                {/* Dot */}
                                <div className="absolute left-0 mt-1.5 w-10 h-10 bg-white dark:bg-slate-900 border-2 border-primary/20 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-primary/5 transition-all z-10">
                                    <Clock size={16} className="text-primary" />
                                </div>

                                <div className="flex-1 space-y-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 group-hover:border-primary/20 group-hover:bg-white dark:group-hover:bg-slate-800 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span suppressHydrationWarning className="text-xs font-bold text-slate-400 uppercase">{new Date(round.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span suppressHydrationWarning className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">{new Date(round.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="px-3 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 shadow-sm flex items-center gap-1.5">
                                            <User size={12} /> {round.vet?.full_name}
                                        </div>
                                    </div>

                                    {/* Vitals in round */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="bg-white dark:bg-slate-900 p-2 rounded-xl flex items-center gap-2 border border-slate-100 dark:border-slate-800">
                                            <Thermometer size={14} className="text-orange-500" />
                                            <span className="text-xs font-bold dark:text-slate-200">{round.vitals?.temp || "--"}°C</span>
                                        </div>
                                        <div className="bg-white dark:bg-slate-900 p-2 rounded-xl flex items-center gap-2 border border-slate-100 dark:border-slate-800">
                                            <Heart size={14} className="text-rose-500" />
                                            <span className="text-xs font-bold dark:text-slate-200">{round.vitals?.fc || "--"} lpm</span>
                                        </div>
                                        <div className="bg-white dark:bg-slate-900 p-2 rounded-xl flex items-center gap-2 border border-slate-100 dark:border-slate-800">
                                            <Wind size={14} className="text-blue-500" />
                                            <span className="text-xs font-bold dark:text-slate-200">{round.vitals?.fr || "--"} rpm</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase">Evolución</span>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic">"{round.evolution}"</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase">Tratamiento Aplicado</span>
                                            <div className="mt-1 p-3 bg-primary/5 rounded-xl border border-primary/10 text-xs font-bold text-primary flex items-center gap-2">
                                                <ClipboardCheck size={14} />
                                                {round.treatment_applied}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {rounds.length === 0 && (
                            <div className="text-center py-20">
                                <p className="text-slate-400 text-sm font-bold">Aún no se han registrado rondas médicas.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Round Modal */}
            <AnimatePresence>
                {isRoundModalOpen && (
                    isDesktop ? (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRoundModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                                <div className="p-6 border-b border-border/10 flex items-center justify-between shrink-0">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100"><Stethoscope size={24} className="text-primary" /> Nueva Ronda Médica</h3>
                                    <button onClick={() => setIsRoundModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {RoundFormContent}
                                </div>
                            </motion.div>
                        </div>
                    ) : (
                        <Drawer.Root open={isRoundModalOpen} onOpenChange={(open) => !open && setIsRoundModalOpen(false)}>
                            <Drawer.Portal>
                                <Drawer.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
                                <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[2.5rem] mt-24 fixed bottom-0 left-0 right-0 z-[110] focus:outline-none max-h-[96vh]">
                                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 my-4" />
                                    <div className="px-6 pb-2">
                                        <Drawer.Title className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight italic uppercase">Nueva Ronda</Drawer.Title>
                                        <Drawer.Description className="sr-only">Formulario para registrar una nueva ronda médica.</Drawer.Description>
                                    </div>
                                    <div className="flex-1 overflow-y-auto pb-8">
                                        {RoundFormContent}
                                    </div>
                                </Drawer.Content>
                            </Drawer.Portal>
                        </Drawer.Root>
                    )
                )}

                {isDischargeModalOpen && (
                    isDesktop ? (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDischargeModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-border/10 flex items-center justify-between">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-green-600"><CheckCircle size={24} /> Confirmar Alta</h3>
                                    <button onClick={() => setIsDischargeModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
                                </div>
                                {DischargeContent}
                            </motion.div>
                        </div>
                    ) : (
                        <Drawer.Root open={isDischargeModalOpen} onOpenChange={(open) => !open && setIsDischargeModalOpen(false)}>
                            <Drawer.Portal>
                                <Drawer.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
                                <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[2.5rem] mt-24 fixed bottom-0 left-0 right-0 z-[110] focus:outline-none max-h-[96vh]">
                                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 my-4" />
                                    <div className="px-6 pb-2 text-center">
                                        <Drawer.Title className="text-2xl font-black text-green-600 tracking-tight italic uppercase">Efectuar Alta</Drawer.Title>
                                        <Drawer.Description className="sr-only">Confirmación para dar de alta al paciente.</Drawer.Description>
                                    </div>
                                    <div className="flex-1 overflow-y-auto pb-8">
                                        {DischargeContent}
                                    </div>
                                </Drawer.Content>
                            </Drawer.Portal>
                        </Drawer.Root>
                    )
                )}
            </AnimatePresence>
        </div>
    );
}
