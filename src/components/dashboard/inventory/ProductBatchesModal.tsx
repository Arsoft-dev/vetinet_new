"use client";

import { X, Package, AlertCircle } from "lucide-react";
import { format, isBefore, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Drawer } from "vaul";
import { motion, AnimatePresence } from "framer-motion";

interface Batch {
    id: string;
    batch_number: string;
    expiry_date: string;
    quantity: number;
    warehouse?: { name: string };
}

interface ProductBatchesModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
}

export function ProductBatchesModal({ isOpen, onClose, product }: ProductBatchesModalProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    
    if (!isOpen || !product) return null;

    const batches = (product.batches || []) as Batch[];
    const now = new Date();
    const soon = addMonths(now, 3); // 3 meses para advertencia de vencimiento

    const ModalContent = (
        <div className="p-6 max-h-[60vh] md:max-h-[55vh] overflow-y-auto">
            {batches.length === 0 ? (
                <div className="text-center py-12">
                    <Package size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
                    <p className="text-slate-500 font-medium">No hay lotes registrados para este producto.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Header de la Grilla (Visible solo en escritorio) */}
                    <div className="hidden md:grid grid-cols-4 px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>Lote / Almacén</span>
                        <span className="text-center">Vencimiento</span>
                        <span className="text-center">Existencia</span>
                        <span className="text-right">Estado</span>
                    </div>
                    
                    {/* Lista de Lotes */}
                    {batches.sort((a,b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()).map((batch, index) => {
                        const expiry = batch.expiry_date ? new Date(batch.expiry_date) : null;
                        const isExpired = expiry && isBefore(expiry, now);
                        const isSoon = expiry && isBefore(expiry, soon) && !isExpired;
                        
                        return (
                            <div 
                                key={batch.id || `batch-${index}`} 
                                className={`flex flex-col md:grid md:grid-cols-4 gap-3 md:gap-0 items-start md:items-center p-4 rounded-2xl border transition-all ${
                                    isExpired ? 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' :
                                    isSoon ? 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30' :
                                    'bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-700/50'
                                }`}
                            >
                                {/* Lote y Almacén */}
                                <div className="w-full flex justify-between md:block">
                                    <span className="md:hidden text-[10px] font-black text-slate-400 uppercase">Lote / Almacén</span>
                                    <div className="text-right md:text-left">
                                        <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{batch.batch_number}</p>
                                        <p className="text-[10px] font-semibold text-slate-400 truncate">{batch.warehouse?.name || 'Almacén Principal'}</p>
                                    </div>
                                </div>
                                
                                {/* Vencimiento */}
                                <div className="w-full flex justify-between md:block md:text-center items-center">
                                    <span className="md:hidden text-[10px] font-black text-slate-400 uppercase">Vencimiento</span>
                                    <div className="text-right md:text-center">
                                        {expiry ? (
                                            <div className="flex flex-col items-end md:items-center">
                                                <span className={`text-xs font-bold ${isExpired ? 'text-red-600' : isSoon ? 'text-orange-600' : 'text-slate-655 dark:text-slate-350'}`}>
                                                    {format(expiry, "MMM yyyy", { locale: es })}
                                                </span>
                                                <span className="text-[9px] opacity-60 text-slate-400 dark:text-slate-500">{format(expiry, "dd/MM/yyyy")}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400">N/A</span>
                                        )}
                                    </div>
                                </div>

                                {/* Existencia */}
                                <div className="w-full flex justify-between md:block md:text-center items-center">
                                    <span className="md:hidden text-[10px] font-black text-slate-400 uppercase">Existencia</span>
                                    <div className="text-right md:text-center">
                                        <span className="text-sm font-black text-slate-850 dark:text-slate-100">{batch.quantity}</span>
                                        <span className="text-[10px] text-slate-400 ml-1">{product.unit}</span>
                                    </div>
                                </div>

                                {/* Estado */}
                                <div className="w-full flex justify-between md:block md:text-right items-center">
                                    <span className="md:hidden text-[10px] font-black text-slate-400 uppercase">Estado</span>
                                    <div className="flex justify-end">
                                        {isExpired ? (
                                            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 rounded-md text-[10px] font-black uppercase">Vencido</span>
                                        ) : isSoon ? (
                                            <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 rounded-md text-[10px] font-black uppercase">Próximo</span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-md text-[10px] font-black uppercase">Vigente</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const InfoFooter = (
        <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-border/40 dark:border-slate-800 flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex-shrink-0">
                <AlertCircle size={20} />
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                El sistema utiliza la metodología <span className="font-bold text-blue-600 dark:text-blue-400">FEFO</span> (First Expired, First Out). Los consumos automáticos siempre descontarán del lote con fecha de vencimiento más próxima.
            </p>
        </div>
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
                            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-border/40 dark:border-slate-800"
                        >
                            <div className="p-6 border-b border-border/40 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Gestión de Lotes y Vencimientos</h2>
                                    <p className="text-xs font-bold text-primary uppercase tracking-widest mt-0.5">{product.name}</p>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400">
                                    <X size={20} />
                                </button>
                            </div>
                            {ModalContent}
                            {InfoFooter}
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
                    <Drawer.Title className="sr-only">Lotes y Vencimientos</Drawer.Title>
                    <Drawer.Description className="sr-only">Lista de lotes y fechas de vencimiento de este producto.</Drawer.Description>
                    
                    <div className="px-6 py-2 border-b border-border/40 dark:border-slate-800">
                        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Lotes y Vencimientos</h2>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">{product.name}</p>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {ModalContent}
                    </div>
                    {InfoFooter}
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
