"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Save, ArrowDownCircle, Calendar, PackageOpen } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { receiveStock } from "@/actions/inventory";
import { useRouter } from "next/navigation";
import { Drawer } from "vaul";
import { useMediaQuery } from "@/hooks/use-media-query";

export function ReceiveStockModal({ isOpen, onClose, product }: { isOpen: boolean; onClose: () => void; product: any }) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const form = e.currentTarget;
        const formData = new FormData(form);
        const res = await receiveStock(formData);

        if (res.success) {
            toast.success(res.message);
            onClose();
            router.refresh();
            form.reset();
        } else {
            toast.error(res.message);
        }
        setIsLoading(false);
    };

    if (!product) return null;

    const FormContent = (
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <input type="hidden" name="productId" value={product.id} />

            <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground dark:text-slate-200 ml-1">Cantidad a Ingresar ({product.unit})</label>
                <div className="relative">
                    <PackageOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input required name="quantity" type="number" step="0.01" min="0.01" placeholder="Ej: 50" className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-lg dark:text-slate-100" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground dark:text-slate-200 ml-1">Número de Lote</label>
                    <input name="batchNumber" type="text" placeholder="Opcional" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm dark:text-slate-100" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground dark:text-slate-200 ml-1">Vencimiento</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input name="expiryDate" type="date" className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm dark:text-slate-100" />
                    </div>
                </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-border/40 dark:border-slate-800">
                <button type="button" onClick={onClose} className="px-5 py-3 md:py-2.5 rounded-xl font-bold text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-1 md:flex-none">
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 md:py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed flex-1 md:flex-none"
                >
                    {isLoading ? 'Procesando...' : <><Save size={18} /> Confirmar</>}
                </button>
            </div>
        </form>
    );

    if (isDesktop) {
        return (
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-lg overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-border/40 dark:border-slate-800 flex justify-between items-center bg-blue-50/50 dark:bg-blue-900/10">
                                <div>
                                    <h3 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
                                        <ArrowDownCircle className="text-blue-600" size={24} />
                                        Recibir Mercancía
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Agregando stock a <span className="font-bold text-foreground dark:text-slate-100">{product.name}</span>
                                    </p>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-muted-foreground">
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
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[60]" />
                <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[24px] mt-24 fixed bottom-0 left-0 right-0 z-[70] focus:outline-none max-h-[96vh]">
                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 my-3" />
                    <Drawer.Title className="sr-only">Recibir Mercancía</Drawer.Title>
                    <Drawer.Description className="sr-only">Formulario para ingresar stock del producto {product.name}.</Drawer.Description>
                    
                    <div className="px-6 py-2 border-b border-border/40 dark:border-slate-800 bg-blue-50/30 dark:bg-blue-900/10">
                        <h3 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
                            <ArrowDownCircle className="text-blue-600" size={24} />
                            Recibir Mercancía
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Agregando stock a <span className="font-bold text-foreground dark:text-slate-100">{product.name}</span>
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto pb-4">
                        {FormContent}
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
