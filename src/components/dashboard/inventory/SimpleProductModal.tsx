"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Box } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { updateProduct, createProduct } from "@/actions/inventory";
import { useRouter } from "next/navigation";
import { Drawer } from "vaul";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";

export function CreateProductModal({ isOpen, onClose, productToEdit }: { isOpen: boolean; onClose: () => void; productToEdit?: any }) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>(productToEdit?.category || "Medication");
    const [barcode, setBarcode] = useState<string>(productToEdit?.barcode || "");
    const router = useRouter();
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const isEditMode = !!productToEdit && !productToEdit.barcodeOnly;

    // Sincronizar el estado al editar o recibir código de barras precargado
    useEffect(() => {
        setBarcode(productToEdit?.barcode || "");
        setSelectedCategory(productToEdit?.category || "Medication");
    }, [productToEdit]);

    // Escucha el lector cuando el formulario de producto está abierto
    useBarcodeScanner({
        onScan: (scannedBarcode) => {
            setBarcode(scannedBarcode);
            toast.success(`Código de barras capturado: ${scannedBarcode}`);
        },
        enabled: isOpen
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const form = e.currentTarget;
        const formData = new FormData(form);

        let res;
        if (isEditMode) {
            formData.append("id", productToEdit.id);
            res = await updateProduct(formData);
        } else {
            res = await createProduct(formData);
        }

        if (res.success) {
            toast.success(res.message);
            onClose();
            router.refresh(); // Refresh server data
            if (!isEditMode) form.reset();
        } else {
            toast.error(res.message);
        }
        setIsLoading(false);
    };

    const FormContent = (
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground dark:text-slate-200 ml-1">Nombre del Producto</label>
                    <input required name="name" defaultValue={productToEdit?.name} type="text" placeholder="Ej: Amoxicilina 500mg" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-slate-100" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground dark:text-slate-200 ml-1">Código de Barras (Opcional)</label>
                    <input 
                        name="barcode" 
                        value={barcode} 
                        onChange={(e) => setBarcode(e.target.value)} 
                        type="text" 
                        data-barcode-capture="true"
                        placeholder="Escanea o escribe el código..." 
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-slate-100 font-mono" 
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground dark:text-slate-200 ml-1">Categoría</label>
                    <select 
                        name="category" 
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer dark:text-slate-100"
                    >
                        <option value="Medication">Medicamento</option>
                        <option value="Food">Alimento</option>
                        <option value="Supply">Insumo</option>
                        <option value="Service">Servicio</option>
                        <option value="Other">Otro</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground dark:text-slate-200 ml-1">Unidad</label>
                    <select name="unit" defaultValue={productToEdit?.unit} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer dark:text-slate-100">
                        <option value="unit">Unidad (c/u)</option>
                        <option value="ml">Mililitros (ml)</option>
                        <option value="box">Caja</option>
                        <option value="kg">Kilogramos</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground dark:text-slate-200 ml-1">Precio Venta ($)</label>
                    <input required name="price" defaultValue={productToEdit?.sale_price} type="number" step="0.01" min="0" placeholder="0.00" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-slate-100" />
                </div>
                {selectedCategory !== 'Service' && selectedCategory !== 'Other' && (
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-foreground dark:text-slate-200 ml-1">Alerta Stock Bajo</label>
                        <input name="minStock" defaultValue={productToEdit?.min_stock_level} type="number" min="1" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-slate-100" />
                    </div>
                )}
            </div>

            <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-5 py-3 md:py-2.5 rounded-xl font-bold text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-1 md:flex-none">
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 md:py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed flex-1 md:flex-none"
                >
                    {isLoading ? 'Guardando...' : <><Save size={18} /> {isEditMode ? "Actualizar" : "Crear"}</>}
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
                            <div className="p-6 border-b border-border/40 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                                <h3 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
                                    <Box className="text-primary" size={24} />
                                    {isEditMode ? "Editar Producto" : "Nuevo Producto"}
                                </h3>
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
                    <Drawer.Title className="sr-only">{isEditMode ? "Editar Producto" : "Nuevo Producto"}</Drawer.Title>
                    <Drawer.Description className="sr-only">Formulario para crear o editar un producto en el inventario.</Drawer.Description>
                    
                    <div className="px-6 py-2 border-b border-border/40 dark:border-slate-800">
                        <h3 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
                            <Box className="text-primary" size={24} />
                            {isEditMode ? "Editar Producto" : "Nuevo Producto"}
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto pb-4">
                        {FormContent}
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
