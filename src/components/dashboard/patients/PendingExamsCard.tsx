"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import { ExamUploadModal } from "./ExamUploadModal";

interface PendingExamsCardProps {
    exams: any[];
    clinicId: string; // Needed for upload path security
}

export function PendingExamsCard({ exams, clinicId }: PendingExamsCardProps) {
    const [selectedExam, setSelectedExam] = useState<any>(null);

    // Filter only pending on client side just to be safe, though passed prop should be pre-filtered if desired
    const pending = exams.filter(e => e.status === "pending");

    if (pending.length === 0) return null;

    return (
        <>
            <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl p-4">
                <h3 className="text-orange-800 dark:text-orange-400 font-bold mb-3 flex items-center gap-2">
                    ⚠️ Exámenes Pendientes ({pending.length})
                </h3>
                <div className="space-y-2">
                    {pending.map(exam => (
                        <div key={exam.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-orange-100 dark:border-orange-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                                    <Activity size={16} />
                                </div>
                                <div>
                                    <p className="font-bold text-foreground text-sm">{exam.type}</p>
                                    <p className="text-xs text-muted-foreground">Solicitado el {new Date(exam.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedExam(exam)}
                                className="w-full sm:w-auto text-xs font-bold px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                            >
                                Cargar Resultado
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <ExamUploadModal
                isOpen={!!selectedExam}
                onClose={() => setSelectedExam(null)}
                exam={selectedExam}
                clinicId={clinicId}
            />
        </>
    );
}
