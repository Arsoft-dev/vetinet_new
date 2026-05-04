"use client";

import { X, FileText, Calendar, User, Activity, Printer } from "lucide-react";
import { useState } from "react";
import { Drawer } from "vaul";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ConsultationDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    record: any; // Ideally typed with MedicalRecord interface
    exams: any[];
}

export function ConsultationDetailsModal({ isOpen, onClose, record, exams }: ConsultationDetailsModalProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const [printUrl, setPrintUrl] = useState<string | null>(null);

    if (!isOpen || !record) return null;

    const handlePrint = () => {
        setPrintUrl(`/print/consultation/${record.id}`);
    };

    const Content = (
        <div className="p-8 space-y-8">
            {/* Subjective */}
            <section>
                <h4 className="text-sm uppercase tracking-wider font-bold text-primary mb-3 flex items-center gap-2">
                    <Activity size={16} />
                    Subjetivo (Anamnesis)
                </h4>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {record.subjective || "Sin registro."}
                </div>
            </section>

            {/* Objective (Vitals & Exam) */}
            <section className="space-y-4">
                <h4 className="text-sm uppercase tracking-wider font-bold text-teal-600 flex items-center gap-2">
                    <Activity size={16} />
                    Objetivo (Examen Físico)
                </h4>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-black text-muted-foreground uppercase block mb-1">Peso</span>
                        <p className="font-mono text-lg font-bold text-slate-700 dark:text-slate-200">
                            {record.weight_kg ? `${record.weight_kg} kg` : "--"}
                        </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-black text-muted-foreground uppercase block mb-1">Temp</span>
                        <p className="font-mono text-lg font-bold text-slate-700 dark:text-slate-200">
                            {record.temperature_c ? `${record.temperature_c} °C` : "--"}
                        </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-black text-muted-foreground uppercase block mb-1">FC (lpm)</span>
                        <p className="font-mono text-lg font-bold text-slate-700 dark:text-slate-200">
                            {record.heart_rate || "--"}
                        </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-black text-muted-foreground uppercase block mb-1">FR (rpm)</span>
                        <p className="font-mono text-lg font-bold text-slate-700 dark:text-slate-200">
                            {record.respiratory_rate || "--"}
                        </p>
                    </div>
                </div>

                {/* Narrative Exam */}
                {record.objective && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-gray-700 dark:text-slate-300 whitespace-pre-wrap mt-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase block mb-2">Hallazgos Físicos</span>
                        {record.objective}
                    </div>
                )}
            </section>

            {/* Assessment (Diagnosis) */}
            <section>
                <h4 className="text-sm uppercase tracking-wider font-bold text-primary mb-3">Diagnóstico</h4>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 text-blue-900 dark:text-blue-200 font-medium">
                    {record.assessment || "Pendiente de diagnóstico."}
                </div>
            </section>

            {/* Plan */}
            <section>
                <h4 className="text-sm uppercase tracking-wider font-bold text-primary mb-3">Plan / Tratamiento</h4>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {record.plan || "Sin plan registrado."}
                </div>
            </section>

            {/* Exams */}
            {exams.length > 0 && (
                <section>
                    <h4 className="text-sm uppercase tracking-wider font-bold text-primary mb-3">Exámenes Adjuntos</h4>
                    <div className="flex flex-wrap gap-3">
                        {exams.map(ex => (
                            <a
                                key={ex.id}
                                href={ex.signedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-primary/50 transition-all group shadow-sm"
                            >
                                <div className="p-2 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                    <FileText size={18} />
                                </div>
                                <div>
                                    <span className="block font-bold text-sm text-foreground">{ex.type}</span>
                                    {ex.findings && (
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 italic line-clamp-2 max-w-[200px] mb-1 leading-tight">
                                            "{ex.findings}"
                                        </p>
                                    )}
                                    <span className="text-xs text-green-600 dark:text-green-400 font-medium hover:underline cursor-pointer">Ver Resultado</span>
                                </div>
                            </a>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );

    if (isDesktop) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative flex flex-col border border-border dark:border-slate-800">

                    {/* Header */}
                    <div className="bg-primary/5 dark:bg-primary/10 p-6 border-b border-primary/10 flex justify-between items-start sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-10">
                        <div>
                            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                                {record.assessment || "Consulta General"}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    {new Date(record.visit_date).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                    <User size={14} />
                                    Dr. {record.vet?.full_name}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handlePrint}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-foreground/50 hover:text-emerald-600 transition-colors"
                                title="Imprimir Receta / Historia"
                            >
                                <Printer size={22} />
                            </button>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-foreground/50 hover:text-foreground transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Hidden Print Frame */}
                    {printUrl && (
                        <iframe
                            src={printUrl}
                            className="hidden"
                        />
                    )}

                    {/* Content - SOAP Format */}
                    {Content}

                </div>
            </div>
        );
    }

    return (
        <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[60]" />
                <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[24px] mt-24 fixed bottom-0 left-0 right-0 z-[70] focus:outline-none max-h-[96vh] border-t dark:border-slate-800">
                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 my-3" />
                    <Drawer.Title className="sr-only">Detalles de Consulta</Drawer.Title>
                    <Drawer.Description className="sr-only">Historial y detalles de la consulta seleccionada.</Drawer.Description>
                    
                    <div className="px-6 py-2 border-b border-primary/10 bg-primary/5 dark:bg-primary/10 flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                {record.assessment || "Consulta General"}
                            </h3>
                            <div className="flex flex-col gap-1 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    {new Date(record.visit_date).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                    <User size={14} />
                                    Dr. {record.vet?.full_name}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={handlePrint}
                            className="p-2 hover:bg-slate-100 rounded-full text-foreground/50 hover:text-emerald-600 transition-colors"
                            title="Imprimir Receta / Historia"
                        >
                            <Printer size={22} />
                        </button>
                    </div>

                    {/* Hidden Print Frame */}
                    {printUrl && (
                        <iframe
                            src={printUrl}
                            className="hidden"
                        />
                    )}

                    <div className="flex-1 overflow-y-auto pb-4">
                        {Content}
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
