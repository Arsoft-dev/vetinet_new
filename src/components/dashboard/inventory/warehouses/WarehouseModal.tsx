"use client";

import { useState, useEffect } from "react";
import { X, Save, Warehouse, FileText, ToggleLeft, ToggleRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createWarehouse, updateWarehouse } from "@/actions/warehouses";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Drawer } from "vaul";

interface WarehouseModalProps {
    isOpen: boolean;
    onClose: () => void;
    warehouse?: any; // Si está presente, es modo edición
    onSaveSuccess: () => void;
}

export function WarehouseModal({ isOpen, onClose, warehouse, onSaveSuccess }: WarehouseModalProps) {
    const [name, setName] = useState("");
    const [type, setType] = useState<'storage' | 'point_of_sale' | 'consulting' | 'quarantine'>("storage");
    const [description, setDescription] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    // Cargar datos en modo edición o limpiar en creación
    useEffect(() => {
        if (warehouse) {
            setName(warehouse.name || "");
            setType(warehouse.type || "storage");
            setDescription(warehouse.description || "");
            setIsActive(warehouse.is_active !== undefined ? warehouse.is_active : true);
        } else {
            setName("");
            setType("storage");
            setDescription("");
            setIsActive(true);
        }
    }, [warehouse, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim()) {
            toast.error("El nombre del almacén es obligatorio");
            return;
        }

        setIsSubmitting(true);
        try {
            const data = {
                name,
                type,
                description,
                is_active: isActive
            };

            let res;
            if (warehouse?.id) {
                res = await updateWarehouse(warehouse.id, data);
            } else {
                res = await createWarehouse(data);
            }

            if (res.success) {
                toast.success(res.message);
                onSaveSuccess();
                onClose();
            } else {
                toast.error(res.message);
            }
        } catch (error: any) {
            console.error("Error al guardar almacén:", error);
            toast.error("Ocurrió un error inesperado al guardar el almacén");
        } finally {
            setIsSubmitting(false);
        }
    };

    const FormContent = (
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-4">
                {/* Nombre del Almacén */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Almacén *</label>
                    <div className="relative">
                        <Warehouse className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Farmacia Principal, Consultorio 1..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-bold text-sm text-slate-800 dark:text-slate-100 transition-all"
                        />
                    </div>
                </div>

                {/* Tipo de Almacén */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Ubicación / Almacén</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value as any)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-bold text-sm text-slate-800 dark:text-slate-100 transition-all cursor-pointer"
                    >
                        <option value="storage">Depósito / Bodega General</option>
                        <option value="point_of_sale">Punto de Venta / Farmacia de Atención</option>
                        <option value="consulting">Consultorio / Box Médico</option>
                        <option value="quarantine">Cuarentena (Stock Bloqueado / Devoluciones)</option>
                    </select>
                </div>

                {/* Descripción */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción / Notas</label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-3 text-slate-400" size={18} />
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Detalles sobre el uso del almacén, ubicación física o restricciones..."
                            rows={3}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-medium text-sm text-slate-800 dark:text-slate-100 transition-all resize-none animate-none"
                        />
                    </div>
                </div>

                {/* Estado Activo / Inactivo (solo en modo edición) */}
                {warehouse && (
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div>
                            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">Estado del Almacén</h4>
                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Los almacenes inactivos no se muestran en las opciones de despacho diarios.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsActive(!isActive)}
                            className="text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                        >
                            {isActive ? (
                                <ToggleRight size={40} className="text-emerald-500" />
                            ) : (
                                <ToggleLeft size={40} />
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Botones de Acción */}
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
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save size={14} />
                    {isSubmitting ? "Guardando..." : "Guardar Almacén"}
                </button>
            </div>
        </form>
    );

    if (isDesktop) {
        return (
            <AnimatePresence>
                {isOpen && (
                    <div key="warehouse-modal-backdrop" className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-border/40 dark:border-slate-800"
                        >
                            {/* Encabezado del Modal */}
                            <div className="p-6 border-b border-border/40 dark:border-slate-800 flex justify-between items-center bg-emerald-50/20 dark:bg-slate-800/30">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                                        <Warehouse size={24} className="text-emerald-500" />
                                        {warehouse ? "Editar Almacén" : "Nuevo Almacén"}
                                    </h2>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                                        {warehouse ? "Modifica los datos del almacén seleccionado." : "Registra un nuevo almacén físico o ubicación de inventario."}
                                    </p>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
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
                    <Drawer.Title className="sr-only">{warehouse ? "Editar Almacén" : "Nuevo Almacén"}</Drawer.Title>
                    <Drawer.Description className="sr-only">Formulario para registrar o editar un almacén físico de inventario.</Drawer.Description>
                    
                    <div className="px-6 py-2 border-b border-border/40 dark:border-slate-800">
                        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                            <Warehouse size={24} className="text-emerald-500" />
                            {warehouse ? "Editar Almacén" : "Nuevo Almacén"}
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto pb-4 scrollbar-thin">
                        {FormContent}
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}

