"use client";

import { useState, useEffect } from "react";
import { X, Save, CheckSquare, Square, Calendar, Tag, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { receivePurchaseOrder } from "@/actions/purchase-orders";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Drawer } from "vaul";

interface ReceiveOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: any; // Orden de compra detallada
    onSuccess: () => void;
}

export function ReceiveOrderModal({ isOpen, onClose, order, onSuccess }: ReceiveOrderModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");
    
    // Lista de ítems a procesar
    const [itemsState, setItemsState] = useState<{
        itemId: string;
        productId: string;
        name: string;
        unit: string;
        requestedQty: number;
        checked: boolean; // ¿Se recibe este ítem?
        receivedQty: number;
        batchNumber: string;
        expiryDate: string;
    }[]>([]);

    useEffect(() => {
        if (order && order.items) {
            setItemsState(
                order.items.map((item: any) => ({
                    itemId: item.id,
                    productId: item.product_id,
                    name: item.product?.name || "Producto",
                    unit: item.product?.unit || "und",
                    requestedQty: Number(item.quantity),
                    checked: true, // Recibir por defecto
                    receivedQty: Number(item.quantity), // Toda la cantidad por defecto
                    batchNumber: "",
                    expiryDate: ""
                }))
            );
        }
    }, [order, isOpen]);

    if (!isOpen || !order) return null;

    const handleToggleCheck = (index: number) => {
        setItemsState(prev => prev.map((item, idx) => {
            if (idx === index) {
                const newChecked = !item.checked;
                return {
                    ...item,
                    checked: newChecked,
                    receivedQty: newChecked ? item.requestedQty : 0
                };
            }
            return item;
        }));
    };

    const handleFieldChange = (index: number, field: string, value: any) => {
        setItemsState(prev => prev.map((item, idx) => {
            if (idx === index) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validar que haya al menos un ítem marcado y con cantidad mayor a 0
        const activeItems = itemsState.filter(i => i.checked && i.receivedQty > 0);
        
        if (activeItems.length === 0) {
            toast.error("Debes marcar al menos un producto e ingresar una cantidad mayor a 0.");
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading("Ingresando mercancía al inventario...");
        try {
            const res = await receivePurchaseOrder(
                order.id,
                order.warehouse_id, // Almacén de destino de la OC
                activeItems.map(item => ({
                    itemId: item.itemId,
                    productId: item.productId,
                    quantityReceived: item.receivedQty,
                    batchNumber: item.batchNumber || undefined,
                    expiryDate: item.expiryDate || undefined
                }))
            );

            if (res.success) {
                toast.success(res.message, { id: toastId });
                onSuccess();
                onClose();
            } else {
                toast.error(res.message, { id: toastId });
            }
        } catch (error) {
            console.error("Error receiving PO:", error);
            toast.error("Ocurrió un error inesperado al procesar la mercancía.", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const FormContent = (
        <form onSubmit={handleSubmit} className="flex-grow flex flex-col justify-between p-6">
            <div className="space-y-4">
                {itemsState.map((item, index) => (
                    <div 
                        key={item.itemId} 
                        className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row gap-4 justify-between items-start md:items-center ${
                            item.checked 
                                ? "border-emerald-500 bg-emerald-50/5 dark:bg-emerald-950/5" 
                                : "border-slate-200 dark:border-slate-800 opacity-60"
                        }`}
                    >
                        {/* Izquierda: Checkbox y Nombre */}
                        <div className="flex items-center gap-3 w-full md:max-w-xs shrink-0">
                            <button 
                                type="button" 
                                onClick={() => handleToggleCheck(index)}
                                className="text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors"
                            >
                                {item.checked ? (
                                    <CheckSquare className="text-emerald-500" size={24} />
                                ) : (
                                    <Square size={24} />
                                )}
                            </button>
                            <div className="overflow-hidden">
                                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 truncate" title={item.name}>{item.name}</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    Pedido: {item.requestedQty} {item.unit}
                                </p>
                            </div>
                        </div>

                        {/* Derecha: Configuración del Lote (solo si está marcado) */}
                        {item.checked ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full items-end">
                                {/* Cantidad Recibida */}
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Cantidad ({item.unit})</label>
                                    <input
                                        required
                                        type="number"
                                        step="any"
                                        min="0.01"
                                        max={item.requestedQty} // No permite recibir más de lo pedido por seguridad
                                        value={item.receivedQty}
                                        onChange={(e) => handleFieldChange(index, "receivedQty", parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs text-slate-800 dark:text-slate-100"
                                    />
                                </div>

                                {/* Número de Lote */}
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                        <Tag size={10} /> Nº de Lote
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej: L-481A"
                                        value={item.batchNumber}
                                        onChange={(e) => handleFieldChange(index, "batchNumber", e.target.value)}
                                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs text-slate-800 dark:text-slate-100"
                                    />
                                </div>

                                {/* Vencimiento */}
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                        <Calendar size={10} /> Vencimiento
                                    </label>
                                    <input
                                        type="date"
                                        value={item.expiryDate}
                                        onChange={(e) => handleFieldChange(index, "expiryDate", e.target.value)}
                                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-350"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs font-bold text-slate-400 py-2 flex items-center justify-center w-full">
                                Ítem deseleccionado (No se registrará ingreso)
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 shrink-0">
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
                    {isSubmitting ? "Ingresando..." : "Confirmar Ingreso al Almacén"}
                </button>
            </div>
        </form>
    );

    if (isDesktop) {
        return (
            <AnimatePresence>
                {isOpen && (
                    <div key="receive-order-backdrop" className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden border border-border/40 dark:border-slate-800 my-8 max-h-[90vh] flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-border/40 dark:border-slate-800 flex justify-between items-center bg-emerald-50/20 dark:bg-emerald-950/10 shrink-0">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                                        <Package size={24} className="text-emerald-500" />
                                        Recibir Mercancía - {order.order_number}
                                    </h2>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                                        Destino: <span className="font-bold text-slate-700 dark:text-slate-200">{order.warehouse?.name}</span>. Desmarca los ítems que no llegaron y configura lotes.
                                    </p>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-y-auto scrollbar-thin">
                                {FormContent}
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
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[160]" />
                <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[24px] mt-24 fixed bottom-0 left-0 right-0 z-[170] focus:outline-none max-h-[96vh]">
                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 my-3" />
                    <Drawer.Title className="sr-only">Recibir Mercancía</Drawer.Title>
                    <Drawer.Description className="sr-only">Formulario para recepcionar stock de una orden de compra.</Drawer.Description>
                    
                    <div className="px-6 py-2 border-b border-border/40 dark:border-slate-800">
                        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                            <Package size={24} className="text-emerald-500" />
                            Recibir Mercancía
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">Destino: {order.warehouse?.name}</p>
                    </div>

                    <div className="flex-1 overflow-y-auto pb-4 scrollbar-thin">
                        {FormContent}
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}

