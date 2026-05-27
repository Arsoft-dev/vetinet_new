"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Save, FileText, Building2, Map, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createPurchaseOrder } from "@/actions/purchase-orders";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Drawer } from "vaul";

interface PurchaseOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
}

export function PurchaseOrderModal({ isOpen, onClose, onSaveSuccess }: PurchaseOrderModalProps) {
    const supabase = createClient();
    
    // Datos de soporte
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    // Formulario de Cabecera
    const [supplierId, setSupplierId] = useState("");
    const [warehouseId, setWarehouseId] = useState("");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Formulario de Items (temporal)
    const [selectedProductId, setSelectedProductId] = useState("");
    const [itemQuantity, setItemQuantity] = useState("1");
    const [itemUnitPrice, setItemUnitPrice] = useState("");

    // Lista de ítems de la orden
    const [orderItems, setOrderItems] = useState<{
        productId: string;
        name: string;
        unit: string;
        quantity: number;
        unitPrice: number;
    }[]>([]);

    const isDesktop = useMediaQuery("(min-width: 768px)");

    // Cargar Catálogos
    useEffect(() => {
        if (!isOpen) return;

        const loadCatalogs = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: member } = await supabase
                    .from("clinic_members")
                    .select("clinic_id")
                    .eq("user_id", user.id)
                    .single();

                if (!member) return;

                // 1. Proveedores
                const { data: sups } = await supabase
                    .from("suppliers")
                    .select("id, name")
                    .eq("clinic_id", member.clinic_id)
                    .eq("is_active", true)
                    .order("name");
                setSuppliers(sups || []);

                // 2. Almacenes
                const { data: whs } = await supabase
                    .from("warehouses")
                    .select("id, name")
                    .eq("clinic_id", member.clinic_id)
                    .eq("is_active", true)
                    .order("name");
                setWarehouses(whs || []);
                if (whs && whs.length > 0) setWarehouseId(whs[0].id);

                // 3. Productos (Catálogo)
                const { data: prods } = await supabase
                    .from("products")
                    .select("id, name, unit, sale_price")
                    .eq("is_archived", false)
                    .order("name");
                setProducts(prods || []);
            } catch (error) {
                console.error("Error al cargar catálogos:", error);
                toast.error("Error al iniciar el formulario.");
            }
        };

        loadCatalogs();
    }, [isOpen]);

    // Actualizar precio por defecto al seleccionar producto
    const handleProductChange = (prodId: string) => {
        setSelectedProductId(prodId);
        const prod = products.find(p => p.id === prodId);
        if (prod) {
            // El costo unitario de compra suele ser menor al precio de venta, 
            // pero lo ponemos como sugerencia inicial o en blanco.
            setItemUnitPrice(String(prod.sale_price || ""));
        }
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedProductId) {
            toast.error("Selecciona un producto");
            return;
        }

        const qty = parseFloat(itemQuantity);
        const price = parseFloat(itemUnitPrice);

        if (isNaN(qty) || qty <= 0) {
            toast.error("Ingresa una cantidad válida mayor a 0");
            return;
        }
        if (isNaN(price) || price < 0) {
            toast.error("Ingresa un precio unitario válido");
            return;
        }

        // Evitar duplicados
        if (orderItems.some(i => i.productId === selectedProductId)) {
            toast.error("Este producto ya está agregado. Elimínalo si deseas cambiar la cantidad.");
            return;
        }

        const prod = products.find(p => p.id === selectedProductId);
        if (prod) {
            setOrderItems(prev => [
                ...prev,
                {
                    productId: selectedProductId,
                    name: prod.name,
                    unit: prod.unit || "und",
                    quantity: qty,
                    unitPrice: price
                }
            ]);

            // Limpiar inputs de item
            setSelectedProductId("");
            setItemQuantity("1");
            setItemUnitPrice("");
        }
    };

    const handleRemoveItem = (prodId: string) => {
        setOrderItems(prev => prev.filter(item => item.productId !== prodId));
    };

    const handleSubmitOrder = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!supplierId) {
            toast.error("Selecciona un proveedor");
            return;
        }
        if (!warehouseId) {
            toast.error("Selecciona un almacén de destino");
            return;
        }
        if (orderItems.length === 0) {
            toast.error("Agrega al menos un producto a la orden de compra");
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading("Registrando orden de compra...");
        try {
            const res = await createPurchaseOrder({
                supplierId,
                warehouseId,
                notes,
                items: orderItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice
                }))
            });

            if (res.success) {
                toast.success(res.message, { id: toastId });
                // Reiniciar
                setSupplierId("");
                setNotes("");
                setOrderItems([]);
                onSaveSuccess();
                onClose();
            } else {
                toast.error(res.message, { id: toastId });
            }
        } catch (error) {
            console.error("Error creating PO:", error);
            toast.error("Ocurrió un error al enviar la orden de compra.", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const orderTotal = orderItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

    if (!isOpen) return null;

    const ModalFormContent = (
        <div className="space-y-6">
            {/* 1. Cabecera de Configuración */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seleccionar Proveedor *</label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                            required
                            value={supplierId}
                            onChange={(e) => setSupplierId(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-sm text-slate-800 dark:text-slate-100 transition-all"
                        >
                            <option value="">-- Elige un Proveedor --</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Almacén Destino *</label>
                    <div className="relative">
                        <Map className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                            required
                            value={warehouseId}
                            onChange={(e) => setWarehouseId(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-sm text-slate-800 dark:text-slate-100 transition-all"
                        >
                            {warehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* 2. Añadir Item (Formulario Interno) */}
            <div className="space-y-2 bg-blue-50/10 dark:bg-slate-800/30 p-5 rounded-2xl border border-blue-100/30 dark:border-slate-800/50">
                <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-2">Agregar Producto a la Lista</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                    <div className="sm:col-span-2 space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Producto</label>
                        <select
                            value={selectedProductId}
                            onChange={(e) => handleProductChange(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-xs"
                        >
                            <option value="">-- Seleccionar --</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.unit || "und"})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cantidad</label>
                        <input
                            type="number"
                            step="any"
                            min="0.01"
                            value={itemQuantity}
                            onChange={(e) => setItemQuantity(e.target.value)}
                            placeholder="1.00"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-xs"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Precio Unitario (USD)</label>
                        <input
                            type="number"
                            step="any"
                            min="0"
                            value={itemUnitPrice}
                            onChange={(e) => setItemUnitPrice(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-xs"
                        />
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                    <button
                        type="button"
                        onClick={(e) => handleAddItem(e as any)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/15"
                    >
                        <Plus size={14} /> Añadir Ítem
                    </button>
                </div>
            </div>

            {/* 3. Tabla / Resumen de Items agregados con Scroll Horizontal Táctil */}
            <div className="space-y-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Resumen de la Orden</h3>
                {orderItems.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-sm font-medium">
                        Aún no has agregado ningún producto. Usa el formulario de arriba.
                    </div>
                ) : (
                    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm w-full overflow-x-auto scrollbar-thin">
                        <table className="w-full text-left border-collapse text-xs min-w-[600px]">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-bold uppercase tracking-widest text-[9px] border-b border-slate-100 dark:border-slate-800">
                                    <th className="p-3">Producto</th>
                                    <th className="p-3 text-center">Cantidad</th>
                                    <th className="p-3 text-right">Precio Unitario</th>
                                    <th className="p-3 text-right">Total</th>
                                    <th className="p-3 text-center w-12">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {orderItems.map((item, index) => (
                                    <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-slate-700 dark:text-slate-300 font-bold">
                                        <td className="p-3">{item.name}</td>
                                        <td className="p-3 text-center">{item.quantity} <span className="text-[10px] text-slate-400 font-medium lowercase ml-0.5">{item.unit}</span></td>
                                        <td className="p-3 text-right">${item.unitPrice.toFixed(2)}</td>
                                        <td className="p-3 text-right text-blue-500">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                                        <td className="p-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(item.productId)}
                                                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-50/50 dark:bg-slate-800/10 font-black text-slate-800 dark:text-slate-100 border-t border-slate-200 dark:border-slate-800">
                                    <td colSpan={3} className="p-4 text-right uppercase tracking-wider text-[10px] text-slate-400">Total Estimado (USD)</td>
                                    <td className="p-4 text-right text-base text-emerald-500">${orderTotal.toFixed(2)}</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* 4. Notas / Observaciones */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas / Observaciones</label>
                <div className="relative">
                    <FileText className="absolute left-3 top-3 text-slate-400" size={18} />
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Instrucciones especiales, términos de pago, fecha estimada de entrega..."
                        rows={3}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-medium text-sm text-slate-800 dark:text-slate-100 transition-all resize-none"
                    />
                </div>
            </div>
        </div>
    );

    const ModalFooter = (
        <div className="flex gap-3 w-full">
            <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
                Cancelar
            </button>
            <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3.5 bg-blue-600 hover:bg-blue-750 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Save size={14} />
                {isSubmitting ? "Creando..." : "Crear Orden de Compra"}
            </button>
        </div>
    );

    if (isDesktop) {
        return (
            <AnimatePresence>
                {isOpen && (
                    <div key="purchase-order-backdrop" className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden border border-border/40 dark:border-slate-800 my-8 max-h-[90vh] flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-border/40 dark:border-slate-800 flex justify-between items-center bg-blue-50/20 dark:bg-slate-800/30 shrink-0">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                                        <ShoppingBag size={24} className="text-blue-500" />
                                        Nueva Orden de Compra (OC)
                                    </h2>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                                        Crea un borrador de orden de compra para enviar a tus proveedores de confianza.
                                    </p>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content Area - Scrollable */}
                            <div className="p-6 overflow-y-auto flex-1 scrollbar-thin">
                                {ModalFormContent}
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex bg-slate-50/30 dark:bg-slate-800/10 shrink-0">
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
                    <Drawer.Title className="sr-only">Nueva Orden de Compra (OC)</Drawer.Title>
                    <Drawer.Description className="sr-only">Formulario para crear una orden de compra comercial.</Drawer.Description>
                    
                    <div className="px-6 py-2 border-b border-border/40 dark:border-slate-800 flex justify-between items-center">
                        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                            <ShoppingBag size={24} className="text-blue-500" />
                            Nueva Orden de Compra
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

