"use client";

import { useState, useTransition } from "react";
import { Search, Plus, User, ArrowRight, Bed, Calendar, Activity, X, ClipboardList, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { admitPet } from "@/actions/hospital";

import { Drawer } from "vaul";
import { useMediaQuery } from "@/hooks/use-media-query";

interface HospitalizedPet {
    id: string;
    entry_date: string;
    reason: string;
    pet: {
        id: string;
        name: string;
        species: string;
        breed: string;
        avatar_url: string | null;
        owner: {
            full_name: string;
        } | null;
    } | null;
}

export function HospitalPetList({ initialHospitalized, allPets }: { initialHospitalized: any[]; allPets: any[] }) {
    const [search, setSearch] = useState("");
    const [isAdmissionOpen, setIsAdmissionOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const filtered = initialHospitalized.filter(h => 
        h.pet?.name.toLowerCase().includes(search.toLowerCase()) ||
        h.pet?.owner?.full_name.toLowerCase().includes(search.toLowerCase())
    );

    const handleAdmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        const petId = formData.get("petId") as string;
        const reason = formData.get("reason") as string;
        const notes = formData.get("notes") as string;

        startTransition(async () => {
            try {
                await admitPet(petId, reason, notes);
                toast.success("Paciente ingresado con éxito");
                setIsAdmissionOpen(false);
            } catch (error: any) {
                toast.error(error.message);
            }
        });
    };

    const AdmissionFormContent = (
        <form onSubmit={handleAdmit} className="p-8 space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Seleccionar Paciente</label>
                <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select name="petId" required className="w-full pl-12 pr-10 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all text-slate-800 dark:text-slate-100 font-bold appearance-none cursor-pointer">
                        <option value="">Buscar en la base de datos...</option>
                        {allPets.map(p => (
                            <option key={p.id} value={p.id}>{p.name} · {p.owner?.full_name}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ArrowRight size={16} className="text-slate-400 rotate-90" />
                    </div>
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Motivo de Internación</label>
                <div className="relative">
                    <ClipboardList className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input name="reason" placeholder="Ej. Insuficiencia Renal, Post-operatorio..." required className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all text-slate-800 dark:text-slate-100 font-bold" />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Plan de Tratamiento Inicial</label>
                <textarea name="notes" placeholder="Indique fluidoterapia, medicación, frecuencia de rondas..." rows={4} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all text-slate-800 dark:text-slate-100 font-bold resize-none text-sm" />
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary/30 hover:bg-primary/90 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
                {isPending ? "Procesando Admisión..." : <><Plus size={20} /> Formalizar Ingreso</>}
            </button>
        </form>
    );

    return (
        <div className="space-y-6">
            {/* Search & Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar pacientes internos..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-border/10 dark:border-slate-800 rounded-[1.5rem] shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all text-slate-800 dark:text-slate-100 font-medium"
                    />
                </div>
                <button
                    onClick={() => setIsAdmissionOpen(true)}
                    className="w-full md:w-auto px-8 py-4 bg-primary text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:-translate-y-0.5 active:scale-95"
                >
                    <Plus size={20} />
                    Registrar Ingreso
                </button>
            </div>

            {/* Patients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filtered.map((h, index) => (
                        <motion.div
                            key={h.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-border/10 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all overflow-hidden flex flex-col group relative"
                        >
                            <div className="p-8 flex-1 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform shrink-0 overflow-hidden border border-rose-100 dark:border-rose-900/30">
                                            {h.pet?.avatar_url ? (
                                                <img src={h.pet.avatar_url} className="w-full h-full object-cover" alt={h.pet.name} />
                                            ) : (
                                                <span>{h.pet?.species === "Gato" ? "🐱" : "🐶"}</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors tracking-tight">{h.pet?.name}</h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{h.pet?.breed || "Mestizo"}</p>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-1.5 shadow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">En Planta</span>
                                    </div>
                                </div>

                                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-700/50">
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700"><Clock size={14} className="text-primary" /></div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingreso</span>
                                            <span suppressHydrationWarning className="font-bold text-slate-700 dark:text-slate-200">{new Date(h.entry_date).toLocaleDateString()} · {new Date(h.entry_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700"><ClipboardList size={14} className="text-primary" /></div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diagnóstico Presuntivo</span>
                                            <span className="font-bold text-slate-600 dark:text-slate-400 text-xs line-clamp-1 italic">"{h.reason}"</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Link 
                                href={`/dashboard/hospital/${h.id}`}
                                className="p-6 bg-slate-50 dark:bg-slate-800/80 border-t border-border/10 dark:border-slate-700 group-hover:bg-primary transition-all flex items-center justify-between"
                            >
                                <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 group-hover:text-white transition-colors">Monitoreo & Rondas</span>
                                <div className="p-2 bg-white dark:bg-slate-700 rounded-xl text-primary dark:text-white shadow-sm group-hover:shadow-none group-hover:bg-primary-foreground group-hover:text-primary transition-all">
                                    <ArrowRight size={18} />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-32 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
                    <div className="bg-slate-50 dark:bg-slate-800 w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <Bed className="text-slate-300 dark:text-slate-600" size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2 italic uppercase">Planta Vacía</h3>
                    <p className="text-slate-400 font-medium max-w-xs mx-auto">No hay pacientes requiriendo hospitalización en este momento. ¡Excelente noticia!</p>
                </div>
            )}

            {/* Admission Modal */}
            <AnimatePresence>
                {isAdmissionOpen && (
                    isDesktop ? (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdmissionOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" />
                            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white/10">
                                <div className="p-8 border-b border-border/10 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                                            <Activity size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight italic uppercase">Nuevo Ingreso</h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admisión Médica</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsAdmissionOpen(false)} className="p-3 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-colors">
                                        <X size={20} className="text-slate-400" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {AdmissionFormContent}
                                </div>
                            </motion.div>
                        </div>
                    ) : (
                        <Drawer.Root open={isAdmissionOpen} onOpenChange={(open) => !open && setIsAdmissionOpen(false)}>
                            <Drawer.Portal>
                                <Drawer.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100]" />
                                <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[2.5rem] mt-24 fixed bottom-0 left-0 right-0 z-[110] focus:outline-none max-h-[96vh]">
                                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 my-4" />
                                    <div className="px-8 pb-2">
                                        <Drawer.Title className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight italic uppercase">Nuevo Ingreso</Drawer.Title>
                                        <Drawer.Description className="sr-only">Formulario para registrar un nuevo ingreso hospitalario.</Drawer.Description>
                                    </div>
                                    <div className="flex-1 overflow-y-auto pb-8">
                                        {AdmissionFormContent}
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
