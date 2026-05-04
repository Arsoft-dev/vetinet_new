"use client";

import { X, Printer, Calendar, User, Activity, Bed, ClipboardCheck, Thermometer, Heart, Wind, FlaskConical } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { useMediaQuery } from "@/hooks/use-media-query";
import { getHospitalizationReport } from "@/actions/hospital";

interface HospitalReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    hospitalization: any;
}

export function HospitalReportModal({ isOpen, onClose, hospitalization }: HospitalReportModalProps) {
    const [rounds, setRounds] = useState<any[]>([]);
    const [exams, setExams] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();
    const isDesktop = useMediaQuery("(min-width: 768px)");

    useEffect(() => {
        if (isOpen && hospitalization?.id) {
            fetchDetails();
        }
    }, [isOpen, hospitalization]);

    const fetchDetails = async () => {
        setIsLoading(true);
        try {
            const { rounds: roundsData, exams: examsData } = await getHospitalizationReport(hospitalization.id);

            // Generate Signed URLs for exams with files
            const examsWithUrls = await Promise.all((examsData || []).map(async (exam: any) => {
                if (exam.status === 'completed' && exam.results_url) {
                    const { data } = await supabase.storage
                        .from('exams')
                        .createSignedUrl(exam.results_url, 3600);
                    return { ...exam, signedUrl: data?.signedUrl };
                }
                return exam;
            }));

            setRounds(roundsData || []);
            setExams(examsWithUrls || []);
        } catch (error) {
            console.error("Error fetching report details:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !hospitalization) return null;

    const handlePrint = () => {
        window.open(`/print/hospitalization/${hospitalization.id}`, '_blank');
    };

    const Content = (
        <div className="p-8 overflow-y-auto space-y-10">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Generando Informe...</p>
                </div>
            ) : (
                <>
                    {/* Admission Info */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Fecha de Ingreso</span>
                            <p className="font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                <Calendar size={16} className="text-blue-500" />
                                {new Date(hospitalization.entry_date).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Fecha de Alta</span>
                            <p className="font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                <Calendar size={16} className="text-green-500" />
                                {hospitalization.exit_date ? new Date(hospitalization.exit_date).toLocaleDateString() : "En curso"}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Motivo Principal</span>
                            <p className="font-bold text-slate-700 dark:text-slate-200">{hospitalization.reason || "Sin especificar"}</p>
                        </div>
                    </section>

                    {/* Evolution Rounds */}
                    <section className="space-y-6">
                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <ClipboardCheck size={18} className="text-primary" /> Rondas Médicas y Evolución
                        </h4>
                        <div className="space-y-6">
                            {rounds.map((round) => (
                                <div key={round.id} className="border-l-4 border-blue-100 pl-6 py-2 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-lg">
                                                {new Date(round.created_at).toLocaleString()}
                                            </span>
                                            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                                <User size={14} /> Dr. {round.vet?.full_name}
                                            </span>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                                <Thermometer size={14} className="text-orange-400" /> {round.vitals?.temp || '--'}°C
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                                <Heart size={14} className="text-rose-400" /> {round.vitals?.fc || '--'} lpm
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl space-y-2">
                                            <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500">Evolución</span>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{round.evolution}"</p>
                                        </div>
                                        <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-2xl space-y-2 border border-blue-100/50 dark:border-blue-800/50">
                                            <span className="text-[9px] font-black uppercase text-blue-400 dark:text-blue-500">Tratamiento</span>
                                            <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">{round.treatment_applied}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {rounds.length === 0 && <p className="text-sm text-slate-300 italic pt-2">No hay rondas registradas aún.</p>}
                        </div>
                    </section>

                    {/* Exams Column */}
                    {exams.length > 0 && (
                        <section className="space-y-4 mt-6">
                            <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <FlaskConical size={18} className="text-purple-500" /> Exámenes Realizados
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {exams.map(exam => (
                                    <div key={exam.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm group hover:shadow-md transition-all">
                                        <div className="flex flex-col gap-2 flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                                    <FlaskConical size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{exam.type}</p>
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(exam.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            {exam.findings && (
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 line-clamp-2">
                                                    "{exam.findings}"
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                                exam.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {exam.status === 'pending' ? 'Pendiente' : 'Completado'}
                                            </span>
                                            {(exam as any).signedUrl && (
                                                <a 
                                                    href={(exam as any).signedUrl} 
                                                    target="_blank" 
                                                    className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                                                >
                                                    Ver Archivo
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );

    if (isDesktop) {
        return (
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={onClose} 
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.9, y: 20 }} 
                            className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-border/10 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
                                        <Bed size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Resumen de Hospitalización</h3>
                                        <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">Paciente: {hospitalization.pet?.name || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={handlePrint}
                                        className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all group"
                                        title="Imprimir Informe"
                                    >
                                        <Printer size={20} className="group-hover:scale-110 transition-transform" />
                                    </button>
                                    <button onClick={onClose} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            {Content}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        );
    }

    return (
        <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[100]" />
                <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[24px] mt-24 fixed bottom-0 left-0 right-0 z-[110] focus:outline-none max-h-[96vh]">
                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 my-3" />
                    <Drawer.Title className="sr-only">Resumen de Hospitalización</Drawer.Title>
                    <Drawer.Description className="sr-only">Detalles y reporte de la hospitalización de {hospitalization.pet?.name || "N/A"}.</Drawer.Description>
                    
                    <div className="px-6 py-4 border-b border-border/10 bg-slate-50/50 dark:bg-slate-800/50 shrink-0 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                                <Bed size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Resumen Hospitalización</h3>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Paciente: {hospitalization.pet?.name || "N/A"}</p>
                            </div>
                        </div>
                        <button 
                            onClick={handlePrint}
                            className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all"
                            title="Imprimir Informe"
                        >
                            <Printer size={18} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {Content}
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
