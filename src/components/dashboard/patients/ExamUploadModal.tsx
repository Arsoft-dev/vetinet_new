"use client";

import { useState } from "react";
import { Upload, X, Check, File } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { completeExamOrder } from "@/actions/complete-exam";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ExamUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    exam: any; // Using any for simplicity in rapid dev, strict type better later
    clinicId: string; // Passed from parent for folder structure
}

export function ExamUploadModal({ isOpen, onClose, exam, clinicId }: ExamUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [findings, setFindings] = useState("");
    const [uploading, setUploading] = useState(false);
    const router = useRouter();
    const isDesktop = useMediaQuery("(min-width: 768px)");

    if (!isOpen || !exam) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error("Por favor selecciona un archivo");
            return;
        }
        setUploading(true);

        try {
            const supabase = createClient();

            // 1. Upload to Supabase Storage
            const filePath = `${clinicId}/${exam.pet_id}/${exam.id}_${file.name}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("exams")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Server Action to Update DB
            await completeExamOrder(exam.id, filePath, exam.pet_id, findings);

            toast.success("Resultado cargado exitosamente");
            setFindings("");
            setFile(null);
            onClose();
            router.refresh();

        } catch (error: any) {
            console.error("Upload Error:", error);
            toast.error("Error al subir archivo: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const FormContent = (
        <div className="p-6 space-y-4">
            <div className="text-center mb-2">
                <span className="inline-block px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold mb-2">
                    {exam.type}
                </span>
                <p className="text-sm text-muted-foreground">Sube el archivo (PDF, Imagen, etc.) para completar esta orden.</p>
            </div>

            {/* Dropzone Area */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Archivo de Resultado</label>
                <div className="border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-center relative">
                    <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                    />
                    {file ? (
                        <div className="flex flex-col items-center text-primary">
                            <File size={24} className="mb-2" />
                            <span className="font-bold text-xs break-all">{file.name}</span>
                            <span className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-gray-400">
                            <Upload size={24} className="mb-2" />
                            <span className="font-bold text-xs text-gray-600 dark:text-slate-400">Sube el archivo aquí</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Findings Textarea */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hallazgos / Interpretación</label>
                <textarea
                    value={findings}
                    onChange={(e) => setFindings(e.target.value)}
                    placeholder="Ej: Valores normales, se observa inflamación..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm resize-none text-foreground rounded-xl"
                />
            </div>

            <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
                {uploading ? (
                    <>Subiendo...</>
                ) : (
                    <>Confirmar y Guardar <Check size={18} /></>
                )}
            </button>
        </div>
    );

    if (isDesktop) {
        return (
            <AnimatePresence>
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                            <h3 className="font-bold text-foreground">Cargar Resultado</h3>
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400">
                                <X size={20} />
                            </button>
                        </div>
                        {FormContent}
                    </motion.div>
                </div>
            </AnimatePresence>
        );
    }

    return (
        <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[60]" />
                <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[24px] mt-24 fixed bottom-0 left-0 right-0 z-[70] focus:outline-none max-h-[96vh]">
                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 my-3" />
                    <Drawer.Title className="sr-only">Cargar Resultado de Examen</Drawer.Title>
                    <Drawer.Description className="sr-only">Sube un archivo con los resultados de {exam.type}</Drawer.Description>
                    
                    <div className="px-6 py-2 border-b border-border/40 bg-slate-50 dark:bg-slate-800/50">
                        <h3 className="font-bold text-foreground">Cargar Resultado</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto pb-4">
                        {FormContent}
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
