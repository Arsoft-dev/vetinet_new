"use client";

import { FileText } from "lucide-react";
import { useState } from "react";
import { ConsultationDetailsModal } from "./ConsultationDetailsModal";

interface ConsultationHistoryListProps {
    history: any[];
    examsWithUrls: any[];
}

export function ConsultationHistoryList({ history, examsWithUrls }: ConsultationHistoryListProps) {
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

    return (
        <>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border/40 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border/40 flex items-center justify-between">
                    <h2 className="font-heading font-bold text-lg text-foreground">Historial Clínico</h2>
                </div>

                <div className="p-0">
                    {history && history.length > 0 ? (
                        <div className="divide-y divide-gray-100 dark:divide-slate-800">
                            {history.map((record) => {
                                // Find exams linked to this consultation
                                const consultationExams = examsWithUrls?.filter(e => e.consultation_id === record.id && e.status === 'completed') || [];

                                return (
                                    <div
                                        key={record.id}
                                        onClick={() => setSelectedRecord(record)}
                                        className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group cursor-pointer active:bg-slate-100 dark:active:bg-slate-700"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">
                                                    {record.assessment || record.reason || "Consulta General"}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(record.visit_date).toLocaleDateString()} • Dr. {record.vet?.full_name}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                                            {record.subjective || "Sin detalles registrados."}
                                        </p>

                                        {/* Attachments Preview */}
                                        {consultationExams.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                                                {consultationExams.map(ex => (
                                                    <span
                                                        key={ex.id}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-bold"
                                                    >
                                                        <FileText size={14} />
                                                        {ex.type}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-12 text-center text-muted-foreground">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText size={32} className="text-slate-300 dark:text-slate-600" />
                            </div>
                            <p className="font-medium">No hay historial clínico aún.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for Details */}
            {selectedRecord && (
                <ConsultationDetailsModal
                    isOpen={!!selectedRecord}
                    onClose={() => setSelectedRecord(null)}
                    record={selectedRecord}
                    exams={examsWithUrls?.filter(e => e.consultation_id === selectedRecord.id && e.status === 'completed') || []}
                />
            )}
        </>
    );
}
