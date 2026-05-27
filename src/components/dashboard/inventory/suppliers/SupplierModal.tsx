"use client";

import { useState, useEffect } from "react";
import { X, Save, Building2, Phone, Mail, MapPin, User, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createSupplier, updateSupplier } from "@/actions/suppliers";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Drawer } from "vaul";

interface SupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplier?: any; // Si está presente, es modo edición
    onSaveSuccess: () => void;
}

export function SupplierModal({ isOpen, onClose, supplier, onSaveSuccess }: SupplierModalProps) {
    const [name, setName] = useState("");
    const [taxId, setTaxId] = useState("");
    const [contactPerson, setContactPerson] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    // Cargar datos si es modo edición
    useEffect(() => {
        if (supplier) {
            setName(supplier.name || "");
            setTaxId(supplier.tax_id || "");
            setContactPerson(supplier.contact_person || "");
            setPhone(supplier.phone || "");
            setEmail(supplier.email || "");
            setAddress(supplier.address || "");
        } else {
            // Limpiar si es creación
            setName("");
            setTaxId("");
            setContactPerson("");
            setPhone("");
            setEmail("");
            setAddress("");
        }
    }, [supplier, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim()) {
            toast.error("El nombre del proveedor es obligatorio");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = {
                name,
                tax_id: taxId,
                contact_person: contactPerson,
                phone,
                email,
                address
            };

            let res;
            if (supplier?.id) {
                res = await updateSupplier(supplier.id, formData);
            } else {
                res = await createSupplier(formData);
            }

            if (res.success) {
                toast.success(res.message);
                onSaveSuccess();
                onClose();
            } else {
                toast.error(res.message);
            }
        } catch (error: any) {
            console.error("Error saving supplier:", error);
            toast.error("Ocurrió un error inesperado al guardar el proveedor");
        } finally {
            setIsSubmitting(false);
        }
    };

    const FormContent = (
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre del Proveedor */}
                <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre / Razón Social *</label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Distribuidora Veterinaria C.A."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-sm text-slate-800 dark:text-slate-100 transition-all"
                        />
                    </div>
                </div>

                {/* RIF o ID Fiscal */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RIF / ID Fiscal</label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={taxId}
                            onChange={(e) => setTaxId(e.target.value)}
                            placeholder="Ej: J-12345678-9"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-sm text-slate-800 dark:text-slate-100 transition-all"
                        />
                    </div>
                </div>

                {/* Persona de Contacto */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Encargado / Contacto</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={contactPerson}
                            onChange={(e) => setContactPerson(e.target.value)}
                            placeholder="Ej: Juan Pérez"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-sm text-slate-800 dark:text-slate-100 transition-all"
                        />
                    </div>
                </div>

                {/* Teléfono */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Ej: +58 412 1234567"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-sm text-slate-800 dark:text-slate-100 transition-all"
                        />
                    </div>
                </div>

                {/* Correo Electrónico */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Ej: contacto@proveedor.com"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-sm text-slate-800 dark:text-slate-100 transition-all"
                        />
                    </div>
                </div>

                {/* Dirección */}
                <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección Comercial</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                        <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Dirección completa del almacén u oficinas..."
                            rows={3}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium text-sm text-slate-800 dark:text-slate-100 transition-all resize-none"
                        />
                    </div>
                </div>
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
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-750 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save size={14} />
                    {isSubmitting ? "Guardando..." : "Guardar Proveedor"}
                </button>
            </div>
        </form>
    );

    if (isDesktop) {
        return (
            <AnimatePresence>
                {isOpen && (
                    <div key="supplier-modal-backdrop" className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-border/40 dark:border-slate-800"
                        >
                            {/* Encabezado del Modal */}
                            <div className="p-6 border-b border-border/40 dark:border-slate-800 flex justify-between items-center bg-blue-50/20 dark:bg-slate-800/30">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                                        <Building2 size={24} className="text-blue-500" />
                                        {supplier ? "Editar Proveedor" : "Nuevo Proveedor"}
                                    </h2>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                                        {supplier ? "Modifica los datos del contacto comercial." : "Registra un nuevo contacto comercial para compras y logística."}
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
                    <Drawer.Title className="sr-only">{supplier ? "Editar Proveedor" : "Nuevo Proveedor"}</Drawer.Title>
                    <Drawer.Description className="sr-only">Formulario para registrar o editar un proveedor comercial.</Drawer.Description>
                    
                    <div className="px-6 py-2 border-b border-border/40 dark:border-slate-800">
                        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                            <Building2 size={24} className="text-blue-500" />
                            {supplier ? "Editar Proveedor" : "Nuevo Proveedor"}
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

