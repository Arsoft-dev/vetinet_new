"use client";

import { useState } from "react";
import { HospitalReportModal } from "@/components/dashboard/hospital/HospitalReportModal";
import { Bed, Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface Hospitalization {
    id: string;
    entry_date: string;
    exit_date: string | null;
    status: string;
    reason: string | null;
    treatment_plan: string | null;
}

export function HospitalizationHistoryCard({ history }: { history: Hospitalization[] }) {
    const [selectedHosp, setSelectedHosp] = useState<Hospitalization | null>(null);

    if (!history || history.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border/40 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                        <Bed size={20} />
                    </div>
                    <h3 className="font-bold text-lg text-foreground">Historial Hospitalario</h3>
                </div>
                <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-slate-400 text-sm">No hay registros de hospitalización previos.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border/40 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                            <Bed size={20} />
                        </div>
                        <h3 className="font-bold lg:text-sm text-foreground">Hospitalización</h3>
                    </div>
                </div>

                <div className="space-y-3">
                    {history.map((h, index) => (
                        <motion.div
                            key={h.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-3 rounded-xl border border-slate-50 dark:border-slate-800/50 bg-slate-50/10 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                        >
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                        h.status === 'hospitalized' 
                                        ? 'bg-amber-100 text-amber-700 border-amber-200' 
                                        : 'bg-green-100 text-green-700 border-green-200'
                                    }`}>
                                        {h.status === 'hospitalized' ? 'Hospitalizado' : 'Alta'}
                                    </span>
                                    <button 
                                        onClick={() => setSelectedHosp(h)}
                                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        Ver Informe
                                    </button>
                                </div>
                                <h4 className="font-bold text-xs text-slate-700 dark:text-slate-200 truncate">{h.reason || "Sin diagnóstico"}</h4>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                                    <Calendar size={10} />
                                    {new Date(h.entry_date).toLocaleDateString()}
                                    {h.exit_date && <span className="text-slate-300 dark:text-slate-600">|</span>}
                                    {h.exit_date && <span>Alta: {new Date(h.exit_date).toLocaleDateString()}</span>}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <HospitalReportModal 
                isOpen={!!selectedHosp} 
                onClose={() => setSelectedHosp(null)} 
                hospitalization={selectedHosp} 
            />
        </>
    );
}
