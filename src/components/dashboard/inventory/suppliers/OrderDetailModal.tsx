"use client";

import { useState, useEffect } from "react";
import { X, ClipboardList, Send, Calendar, User, MapPin, Phone, Mail, AlertTriangle, CheckCircle, Ban, Printer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getPurchaseOrderById, updatePurchaseOrderStatus } from "@/actions/purchase-orders";
import { ReceiveOrderModal } from "./ReceiveOrderModal";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Drawer } from "vaul";

interface OrderDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string | null;
    onStatusChangeSuccess: () => void;
}

export function OrderDetailModal({ isOpen, onClose, orderId, onStatusChangeSuccess }: OrderDetailModalProps) {
    const [order, setOrder] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Control del modal de recepción
    const [isReceiveOpen, setIsReceiveOpen] = useState(false);

    // Estados para confirmación embebida y correo
    const [confirmAction, setConfirmAction] = useState<"ordered" | "canceled" | null>(null);
    const [sendEmailToSupplier, setSendEmailToSupplier] = useState(true);

    const isDesktop = useMediaQuery("(min-width: 768px)");

    useEffect(() => {
        if (isOpen && orderId) {
            loadOrderDetails();
            setConfirmAction(null);
            setSendEmailToSupplier(true);
        } else {
            setOrder(null);
        }
    }, [isOpen, orderId]);

    const loadOrderDetails = async () => {
        setIsLoading(true);
        try {
            const data = await getPurchaseOrderById(orderId!);
            if (data) {
                setOrder(data);
            } else {
                toast.error("No se pudo cargar el detalle de la orden.");
                onClose();
            }
        } catch (error) {
            console.error("Error loading order details:", error);
            toast.error("Error al cargar la orden de compra.");
        } finally {
            setIsLoading(false);
        }
    };

    const triggerConfirm = (status: "ordered" | "canceled") => {
        setConfirmAction(status);
    };

    const handleExecuteStatusUpdate = async () => {
        if (!confirmAction || !order) return;

        setIsUpdating(true);
        const toastId = toast.loading("Actualizando estado de la orden...");
        try {
            const res = await updatePurchaseOrderStatus(
                order.id, 
                confirmAction, 
                confirmAction === "ordered" ? sendEmailToSupplier : false
            );
            if (res.success) {
                toast.success(res.message, { id: toastId });
                setConfirmAction(null);
                onStatusChangeSuccess();
                await loadOrderDetails();
            } else {
                toast.error(res.message, { id: toastId });
            }
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Error al actualizar el estado.", { id: toastId });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleReceiveSuccess = () => {
        onStatusChangeSuccess();
        loadOrderDetails(); // Recargar los detalles con las cantidades recibidas actualizadas
    };

    if (!isOpen) return null;

    // Colores para el estado
    const statusMap: Record<string, { label: string, container: string, text: string }> = {
        'pending': { label: 'Borrador / Pendiente', container: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700', text: 'text-slate-650 dark:text-slate-300' },
        'ordered': { label: 'Ordenada / Enviada', container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
        'received': { label: 'Mercancía Recibida', container: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
        'canceled': { label: 'Cancelada', container: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30', text: 'text-red-650 dark:text-red-400' }
    };

    const currentStatus = order ? statusMap[order.status] || { label: order.status, container: 'bg-slate-100', text: 'text-slate-600' } : null;

    const ModalFormContent = (
        <div className="space-y-6">
            {isLoading ? (
                <div className="space-y-4 py-8">
                    <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full w-1/3 animate-pulse" />
                    <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                    <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                </div>
            ) : order ? (
                <>
                    {/* 1. Información General y Estado */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Estado */}
                        <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Estado de la Orden</span>
                            <div className={`px-4 py-2 text-center text-xs font-bold rounded-xl border ${currentStatus?.container} ${currentStatus?.text}`}>
                                {currentStatus?.label}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-3 font-semibold space-y-1">
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={12} /> Creado: {new Date(order.created_at).toLocaleDateString()}
                                </div>
                                {order.received_at && (
                                    <div className="flex items-center gap-1.5 text-emerald-500 font-bold">
                                        <CheckCircle size={12} /> Recibido: {new Date(order.received_at).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Datos del Proveedor */}
                        <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 md:col-span-2 space-y-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Datos del Proveedor</span>
                            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">{order.supplier?.name}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-slate-650 dark:text-slate-400">
                                <div className="flex items-center gap-1.5">
                                    <User size={14} className="text-slate-400 shrink-0" />
                                    <span>{order.supplier?.contact_person || "-"} (Encargado)</span>
                                </div>
                                {order.supplier?.tax_id && (
                                    <div className="flex items-center gap-1.5">
                                        <ClipboardList size={14} className="text-slate-400 shrink-0" />
                                        <span>RIF/ID: {order.supplier.tax_id}</span>
                                    </div>
                                )}
                                {order.supplier?.phone && (
                                    <div className="flex items-center gap-1.5">
                                        <Phone size={14} className="text-slate-400 shrink-0" />
                                        <span>{order.supplier.phone}</span>
                                    </div>
                                )}
                                {order.supplier?.email && (
                                    <div className="flex items-center gap-1.5">
                                        <Mail size={14} className="text-slate-400 shrink-0" />
                                        <span className="truncate">{order.supplier.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Dirección y Almacén */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-650 dark:text-slate-450 bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100/50 dark:border-slate-800/50">
                        <div className="flex items-start gap-2">
                            <MapPin className="text-slate-400 shrink-0 mt-0.5" size={16} />
                            <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Almacén de Destino</span>
                                <span className="text-slate-700 dark:text-slate-200">{order.warehouse?.name}</span>
                            </div>
                        </div>
                        {order.supplier?.address && (
                            <div className="flex items-start gap-2">
                                <MapPin className="text-slate-400 shrink-0 mt-0.5" size={16} />
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Dirección Proveedor</span>
                                    <span className="line-clamp-2 text-slate-700 dark:text-slate-200">{order.supplier.address}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. Listado de Productos Pedidos con Scroll Horizontal Táctil */}
                    <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Productos Pedidos</span>
                        <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm w-full overflow-x-auto scrollbar-thin">
                            <table className="w-full text-left border-collapse text-xs min-w-[600px]">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-bold uppercase tracking-widest text-[9px] border-b border-slate-100 dark:border-slate-800">
                                        <th className="p-3">Código/Barras</th>
                                        <th className="p-3">Producto</th>
                                        <th className="p-3 text-center">Cant. Pedida</th>
                                        <th className="p-3 text-center">Cant. Recibida</th>
                                        <th className="p-3 text-right">Precio Unitario</th>
                                        <th className="p-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {order.items.map((item: any) => (
                                        <tr key={item.id || item.product_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 text-slate-700 dark:text-slate-300 font-bold">
                                            <td className="p-3 text-slate-400 font-mono">{item.product?.barcode || "S/B"}</td>
                                            <td className="p-3">{item.product?.name}</td>
                                            <td className="p-3 text-center">{Number(item.quantity)} <span className="text-[10px] text-slate-400 font-normal lowercase">{item.product?.unit || "und"}</span></td>
                                            <td className="p-3 text-center">
                                                {order.status === 'received' ? (
                                                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${Number(item.received_quantity) === Number(item.quantity) ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                        {Number(item.received_quantity)} {item.product?.unit || "und"}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 font-medium">-</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-right">${Number(item.unit_price).toFixed(2)}</td>
                                            <td className="p-3 text-right text-blue-500">${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-50/50 dark:bg-slate-800/10 font-black text-slate-800 dark:text-slate-100 border-t border-slate-200 dark:border-slate-800">
                                        <td colSpan={4} className="p-4 text-right uppercase tracking-wider text-[10px] text-slate-400">Total de la Orden (USD)</td>
                                        <td className="p-4 text-right text-base text-emerald-500" colSpan={2}>${Number(order.total_amount_usd).toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 3. Observaciones */}
                    {order.notes && (
                        <div className="space-y-1 ml-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Observaciones de la Orden</span>
                            <p className="text-xs text-slate-650 dark:text-slate-350 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 italic whitespace-pre-wrap">{order.notes}</p>
                        </div>
                    )}
                </>
            ) : null}
        </div>
    );

    const ModalFooter = (
        <div className="flex gap-3 justify-end w-full">
            <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
                Cerrar Ventana
            </button>

            {order && !isLoading && (
                <>
                    {/* Acciones para borrador 'pending' */}
                    {order.status === "pending" && (
                        <>
                            <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => triggerConfirm("canceled")}
                                className="px-5 py-3 bg-red-50 hover:bg-red-100 text-red-650 dark:bg-red-950/20 dark:hover:bg-red-900/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-1.5"
                            >
                                <Ban size={14} /> Cancelar Orden
                            </button>
                            <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => triggerConfirm("ordered")}
                                className="px-5 py-3 bg-blue-600 hover:bg-blue-755 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5"
                            >
                                <Send size={14} /> Marcar como Ordenada
                            </button>
                        </>
                    )}

                    {/* Acciones para ordenada 'ordered' */}
                    {order.status === "ordered" && (
                        <>
                            <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => triggerConfirm("canceled")}
                                className="px-5 py-3 bg-red-50 hover:bg-red-100 text-red-650 dark:bg-red-950/20 dark:hover:bg-red-900/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-1.5"
                            >
                                <Ban size={14} /> Cancelar Orden
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsReceiveOpen(true)}
                                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 animate-pulse"
                            >
                                <CheckCircle size={14} /> Recibir Mercancía
                            </button>
                        </>
                    )}
                </>
            )}
        </div>
    );

    return (
        <>
            {isDesktop ? (
                <AnimatePresence>
                    {isOpen && (
                        <div key="order-detail-backdrop" className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden border border-border/40 dark:border-slate-800 my-8 max-h-[90vh] flex flex-col"
                            >
                                {/* Header */}
                                <div className="p-6 border-b border-border/40 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                                            <ClipboardList size={24} className="text-blue-500" />
                                            Detalle de Orden de Compra
                                        </h2>
                                        {order && (
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                                                Nº: <span className="text-blue-500">{order.order_number}</span> | Emitida por: <span className="text-slate-700 dark:text-slate-350">{order.issuer?.full_name || "Desconocido"}</span>
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {order && (
                                            <a 
                                                href={`/print/purchase-order/${order.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-blue-500 flex items-center justify-center animate-pulse"
                                                title="Imprimir / Exportar PDF"
                                            >
                                                <Printer size={20} />
                                            </a>
                                        )}
                                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
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
            ) : (
                <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
                    <Drawer.Portal>
                        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[140]" />
                        <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[24px] mt-24 fixed bottom-0 left-0 right-0 z-[140] focus:outline-none max-h-[96vh]">
                            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 my-3" />
                            <Drawer.Title className="sr-only">Detalle de Orden de Compra</Drawer.Title>
                            <Drawer.Description className="sr-only">Visualización de los detalles de la orden de compra comercial.</Drawer.Description>
                            
                            <div className="px-6 py-2 border-b border-border/40 dark:border-slate-800 flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                                        <ClipboardList size={24} className="text-blue-500" />
                                        Detalle de Orden
                                    </h2>
                                    {order && (
                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">Nº: {order.order_number}</p>
                                    )}
                                </div>
                                {order && (
                                    <a 
                                        href={`/print/purchase-order/${order.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-blue-500 flex items-center justify-center"
                                    >
                                        <Printer size={20} />
                                    </a>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 pb-24 scrollbar-thin">
                                {ModalFormContent}
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 z-[145]">
                                {ModalFooter}
                            </div>
                        </Drawer.Content>
                    </Drawer.Portal>
                </Drawer.Root>
            )}

            {/* Modal Secundario para recibir mercancía */}
            <ReceiveOrderModal 
                key="order-receive-modal-container"
                isOpen={isReceiveOpen}
                onClose={() => setIsReceiveOpen(false)}
                order={order}
                onSuccess={handleReceiveSuccess}
            />

            {/* Modal de confirmación profesional */}
            <AnimatePresence>
                {confirmAction && (
                    <div key="order-status-confirm-backdrop" className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[32px] max-w-md w-full shadow-2xl space-y-5"
                        >
                            <div className="flex gap-4 items-start">
                                <div className={`p-3 rounded-2xl shrink-0 ${confirmAction === "ordered" ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400" : "bg-red-50 text-red-650 dark:bg-red-950/20 dark:text-red-400"}`}>
                                    <AlertTriangle size={24} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                                        {confirmAction === "ordered" ? "Confirmar Envío de Orden" : "Cancelar Orden de Compra"}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                        {confirmAction === "ordered"
                                            ? "Esta acción marcará la orden como enviada formalmente al proveedor, congelando los productos y cantidades para permitir la posterior recepción de mercancía."
                                            : "¿Seguro que deseas cancelar esta orden de compra? Se marcará como cancelada y no podrás procesar ingresos sobre ella."}
                                    </p>
                                </div>
                            </div>

                            {/* Opciones de correo (solo para ordenar y si el proveedor tiene email) */}
                            {confirmAction === "ordered" && order?.supplier?.email && (
                                <div className="flex items-start gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-2xl text-[10px] font-bold text-slate-650 dark:text-slate-350">
                                    <input
                                        type="checkbox"
                                        id="sendEmail"
                                        checked={sendEmailToSupplier}
                                        onChange={(e) => setSendEmailToSupplier(e.target.checked)}
                                        className="mt-0.5 rounded border-slate-300 dark:border-slate-800 text-blue-600 focus:ring-blue-500/20 w-3.5 h-3.5 cursor-pointer"
                                    />
                                    <label htmlFor="sendEmail" className="cursor-pointer select-none leading-relaxed">
                                        Notificar al proveedor al correo <span className="text-blue-500 font-bold">{order.supplier.email}</span> con el detalle de la Orden de Compra.
                                    </label>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setConfirmAction(null)}
                                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                >
                                    Volver
                                </button>
                                <button
                                    type="button"
                                    onClick={handleExecuteStatusUpdate}
                                    disabled={isUpdating}
                                    className={`flex-1 py-3 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                        confirmAction === "ordered"
                                            ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25"
                                            : "bg-red-650 hover:bg-red-700 shadow-lg shadow-red-500/25"
                                    }`}
                                >
                                    {isUpdating ? "Procesando..." : "Confirmar"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

