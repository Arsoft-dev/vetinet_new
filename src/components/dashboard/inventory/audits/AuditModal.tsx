"use client";

import { useState, useEffect } from "react";
import { X, Save, ClipboardCheck, Warehouse, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createInventoryAudit } from "@/actions/inventory-audits";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Drawer } from "vaul";

interface AuditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartSuccess: (auditId: string) => void;
}

export function AuditModal({ isOpen, onClose, onStartSuccess }: AuditModalProps) {
    const supabase = createClient();
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    useEffect(() => {
        if (isOpen) {
            fetchWarehouses();
            setSelectedWarehouseId("");
            setNotes("");
        }
    }, [isOpen]);

    const fetchWarehouses = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: member } = await supabase
            .from("clinic_members")
            .select("clinic_id")
            .eq("user_id", user.id)
            .single();

        if (member) {
            const { data } = await supabase
                .from("warehouses")
                .select("id, name")
                .eq("clinic_id", member.clinic_id)
                .eq("is_active", true)
                .order("name");
            setWarehouses(data || []);
            
            if (data && data.length > 0) {
                setSelectedWarehouseId(data[0].id);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedWarehouseId) {
            toast.error("Debes seleccionar un almacén para auditar.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await createInventoryAudit(selectedWarehouseId, notes);
            if (res.success) {
                toast.success(res.message);
                if (res.auditId) {
                    onStartSuccess(res.auditId);
                }
                onClose();
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            console.error("Error al iniciar auditoría:", error);
            toast.error("Ocurrió un error inesperado al iniciar la auditoría.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const FormContent = (
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Selector de Almacén */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Almacén a Auditar *</label>
                <div className="relative">
                    <Warehouse className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                        required
                        value={selectedWarehouseId}
                        onChange={(e) => setSelectedWarehouseId(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-bold text-sm text-slate-800 dark:text-slate-100 transition-all cursor-pointer"
                    >
                        <option value="">Selecciona almacén...</option>
                        {warehouses.map(wh => (
                            <option key={wh.id} value={wh.id}>{wh.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Notas iniciales */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas / Motivo de la Toma</label>
                <div className="relative">
                    <FileText className="absolute left-3 top-3 text-slate-400" size={18} />
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ej: Toma física de fin de mes, conciliación por cambio de responsable..."
                        rows={3}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-medium text-sm text-slate-800 dark:text-slate-100 transition-all resize-none"
                    />
                </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || !selectedWarehouseId}
                    className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Save size={14} />
                    {isSubmitting ? "Iniciando..." : "Iniciar Auditoría"}
                </button>
            </div>
        </form>
    );

    if (isDesktop) {
        return (
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-border/40 dark:border-slate-800"
                        >
                            <div className="p-6 border-b border-border/40 dark:border-slate-800 flex justify-between items-center bg-amber-50/20 dark:bg-slate-800/30">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                                        <ClipboardCheck size={24} className="text-amber-500" />
                                        Iniciar Auditoría Física
                                    </h2>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                                        Selecciona el almacén para congelar el stock digital actual.
                                    </p>
                                </div>
                                <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                                    <X size={20} />
                                </button>
                            </div>
                            {FormContent}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        );
    }

    return (
        <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[140]" />
                <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[24px] mt-24 fixed bottom-0 left-0 right-0 z-[150] focus:outline-none max-h-[96vh]">
                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 my-3" />
                    <Drawer.Title className="sr-only">Iniciar Auditoría Física</Drawer.Title>
                    <Drawer.Description className="sr-only">Formulario para iniciar una nueva auditoría física.</Drawer.Description>
                    
                    <div className="px-6 py-2 border-b border-border/40 dark:border-slate-800">
                        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                            <ClipboardCheck size={24} className="text-amber-500" />
                            Iniciar Auditoría
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto pb-4">
                        {FormContent}
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
