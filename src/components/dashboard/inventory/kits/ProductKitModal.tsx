"use client";

import { useState, useEffect } from "react";
import { X, Save, Layers, Plus, Trash2, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createProductKit, updateProductKit } from "@/actions/product-kits";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Drawer } from "vaul";

interface ProductKitModalProps {
    isOpen: boolean;
    onClose: () => void;
    kit?: any; // Si está presente, es modo edición
    onSaveSuccess: () => void;
}

export function ProductKitModal({ isOpen, onClose, kit, onSaveSuccess }: ProductKitModalProps) {
    const supabase = createClient();
    const [products, setProducts] = useState<any[]>([]);
    const [billingEnabled, setBillingEnabled] = useState(true);

    // Estados de cabecera
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [salePrice, setSalePrice] = useState("");

    // Estados para la selección del ítem actual
    const [selectedProductId, setSelectedProductId] = useState("");
    const [quantityToAdd, setQuantityToAdd] = useState("");

    // Lista de ítems del kit en local
    const [itemsList, setItemsList] = useState<any[]>([]);

    // Estados de UI
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    // Cargar catálogos y config de facturación de la clínica
    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
            if (kit) {
                setName(kit.name || "");
                setDescription(kit.description || "");
                setSalePrice(kit.sale_price !== undefined ? String(kit.sale_price) : "0");
                // Mapear ítems existentes
                const mappedItems = kit.items?.map((item: any) => ({
                    productId: item.product_id || item.product?.id,
                    productName: item.product?.name || "Producto",
                    productUnit: item.product?.unit || "und",
                    quantity: Number(item.quantity)
                })) || [];
                setItemsList(mappedItems);
            } else {
                setName("");
                setDescription("");
                setSalePrice("0");
                setItemsList([]);
            }
            resetItemSelector();
        }
    }, [isOpen, kit]);

    const resetItemSelector = () => {
        setSelectedProductId("");
        setQuantityToAdd("");
    };

    const fetchInitialData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: member } = await supabase
            .from("clinic_members")
            .select("clinic_id, clinics(billing_enabled)")
            .eq("user_id", user.id)
            .single();

        if (member) {
            setBillingEnabled((member.clinics as any)?.billing_enabled ?? true);

            // Cargar todos los productos de la clínica
            const { data: prods } = await supabase
                .from("products")
                .select("id, name, unit, category")
                .eq("is_archived", false)
                .order("name");
            setProducts(prods || []);
        }
    };

    // Agregar producto al kit de forma local
    const handleAddItem = () => {
        if (!selectedProductId || !quantityToAdd) {
            toast.error("Selecciona un producto y especifica la cantidad.");
            return;
        }

        const qty = parseFloat(quantityToAdd);
        if (isNaN(qty) || qty <= 0) {
            toast.error("La cantidad debe ser mayor a cero.");
            return;
        }

        // Evitar duplicar el producto en la lista local
        const exists = itemsList.some(item => item.productId === selectedProductId);
        if (exists) {
            toast.error("Este producto ya está en el kit. Edítalo o elimínalo primero.");
            return;
        }

        const prod = products.find(p => p.id === selectedProductId);

        setItemsList([...itemsList, {
            productId: selectedProductId,
            productName: prod.name,
            productUnit: prod.unit || "und",
            quantity: qty
        }]);

        resetItemSelector();
    };

    const handleRemoveItem = (index: number) => {
        setItemsList(itemsList.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) return toast.error("El nombre del kit es obligatorio.");
        if (itemsList.length === 0) return toast.error("El kit debe tener al menos un producto.");

        setIsSubmitting(true);
        try {
            const data = {
                name,
                description,
                salePrice: parseFloat(salePrice) || 0,
                items: itemsList.map(it => ({
                    productId: it.productId,
                    quantity: it.quantity
                }))
            };

            let res;
            if (kit?.id) {
                res = await updateProductKit(kit.id, data);
            } else {
                res = await createProductKit(data);
            }

            if (res.success) {
                toast.success(res.message);
                onSaveSuccess();
                onClose();
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            console.error("Error al guardar kit:", error);
            toast.error("Ocurrió un error inesperado al registrar el kit.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const ModalFormContent = (
        <div className="space-y-4">
            {/* Información Básica */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Nombre */}
                <div className="md:col-span-2 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Nombre del Kit *</label>
                    <input
                        required
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Kit Esterilización Canina, Desparasitación..."
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none font-bold text-xs text-slate-800 dark:text-slate-100 transition-all"
                    />
                </div>

                {/* Precio (Opcional - solo si facturación activa) */}
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Precio Combo ($ USD)</label>
                    {billingEnabled ? (
                        <div className="relative">
                            <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="number"
                                step="0.01"
                                value={salePrice}
                                onChange={(e) => setSalePrice(e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none font-bold text-xs text-slate-800 dark:text-slate-100 transition-all"
                            />
                        </div>
                    ) : (
                        <div className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-[10px] text-slate-400 font-bold rounded-xl flex items-center h-8">
                            Facturación Inactiva
                        </div>
                    )}
                </div>

                {/* Descripción */}
                <div className="md:col-span-3 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Descripción del Combo</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Especificaciones o indicaciones generales sobre el uso de este kit..."
                        rows={2}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none font-medium text-xs text-slate-800 dark:text-slate-100 transition-all resize-none"
                    />
                </div>
            </div>

            {/* Agregador de Productos */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Componentes del Kit</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-[20px] border border-slate-100 dark:border-slate-800/30">
                    {/* Producto */}
                    <div className="md:col-span-7 space-y-1 w-full">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-0.5">Producto / Medicamento</label>
                        <select
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none font-bold text-xs text-slate-800 dark:text-slate-100 transition-all cursor-pointer"
                        >
                            <option value="">Buscar producto...</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                            ))}
                        </select>
                    </div>

                    {/* Cantidad */}
                    <div className="md:col-span-3 space-y-1 w-full">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-0.5">Cantidad</label>
                        <input
                            type="number"
                            step="any"
                            value={quantityToAdd}
                            onChange={(e) => setQuantityToAdd(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none font-bold text-xs text-slate-800 dark:text-slate-100 transition-all"
                        />
                    </div>

                    {/* Botón */}
                    <div className="md:col-span-2 w-full">
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="w-full py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-xl font-black text-[10px] uppercase tracking-wider border border-purple-200/40 dark:border-purple-900/30 transition-all flex items-center justify-center gap-1"
                        >
                            <Plus size={12} /> Añadir
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabla de Items con Scroll Horizontal Táctil en Móvil */}
            <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5 font-heading">Productos en el kit</label>
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl overflow-hidden max-h-[180px] w-full overflow-x-auto scrollbar-thin">
                    <table className="w-full text-left text-xs border-collapse min-w-[400px]">
                        <thead className="sticky top-0 bg-slate-50 dark:bg-slate-950 z-10">
                            <tr className="text-slate-400 font-bold uppercase tracking-wider text-[9px] border-b border-slate-150 dark:border-slate-850">
                                <th className="p-3 pl-4">Producto</th>
                                <th className="p-3 text-right">Cantidad</th>
                                <th className="p-3 text-center w-14">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemsList.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="p-6 text-center text-slate-450 font-medium italic">
                                        Ningún componente agregado a la receta.
                                    </td>
                                </tr>
                            ) : (
                                itemsList.map((item, index) => (
                                    <tr key={index} className="border-b border-slate-50 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                                        <td className="p-3 pl-4 font-bold text-slate-800 dark:text-slate-200">{item.productName}</td>
                                        <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">
                                            {item.quantity} <span className="text-[10px] text-slate-400 font-medium uppercase">{item.productUnit}</span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(index)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const ModalFooter = (
        <div className="flex gap-3 w-full">
            <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
                Cancelar
            </button>
            <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || itemsList.length === 0}
                className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-750 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Save size={12} />
                {isSubmitting ? "Guardando..." : "Guardar Kit"}
            </button>
        </div>
    );

    if (isDesktop) {
        return (
            <AnimatePresence>
                {isOpen && (
                    <div key="product-kit-modal-backdrop" className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden border border-border/40 dark:border-slate-800 flex flex-col max-h-[90vh]"
                        >
                            {/* Encabezado Fijo */}
                            <div className="p-5 border-b border-border/40 dark:border-slate-800 flex justify-between items-center bg-purple-50/20 dark:bg-slate-800/30 flex-shrink-0">
                                <div>
                                    <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                                        <Layers size={20} className="text-purple-500" />
                                        {kit ? "Editar Kit / Receta" : "Nuevo Kit / Receta"}
                                    </h2>
                                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                        Agrupa múltiples productos para agilizar su consumo en consultas y fichas médicas.
                                    </p>
                                </div>
                                <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Cuerpo Scrollable */}
                            <div className="p-6 overflow-y-auto flex-1 min-h-0 scrollbar-thin dark:bg-slate-900">
                                {ModalFormContent}
                            </div>

                            {/* Pie de Página Fijo */}
                            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex bg-slate-50/50 dark:bg-slate-955/40 flex-shrink-0">
                                {ModalFooter}
                            </div>
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
                    <Drawer.Title className="sr-only">{kit ? "Editar Kit / Receta" : "Nuevo Kit / Receta"}</Drawer.Title>
                    <Drawer.Description className="sr-only">Formulario para crear y editar combos y recetas de productos.</Drawer.Description>
                    
                    <div className="px-6 py-2 border-b border-border/40 dark:border-slate-800">
                        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                            <Layers size={20} className="text-purple-500" />
                            {kit ? "Editar Kit / Receta" : "Nuevo Kit / Receta"}
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 pb-24 scrollbar-thin">
                        {ModalFormContent}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 z-[160]">
                        {ModalFooter}
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
