"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRightLeft, Plus, Calendar, User, Warehouse, Clipboard, Eye, CheckCircle2, XCircle, AlertTriangle, FileText, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { Drawer } from "vaul";
import { useMediaQuery } from "@/hooks/use-media-query";
import { getInventoryTransfers, getInventoryTransferById, completeInventoryTransfer, cancelInventoryTransfer } from "@/actions/inventory-transfers";
import { TransferModal } from "@/components/dashboard/inventory/warehouses/TransferModal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

export default function TransfersPage() {
    const [transfers, setTransfers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Control de modales
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);
    const [transferDetail, setTransferDetail] = useState<any>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    // Estados de confirmación de acciones
    const [actionTarget, setActionTarget] = useState<{ id: string, type: 'complete' | 'cancel', number?: string } | null>(null);
    const [isProcessingAction, setIsProcessingAction] = useState(false);

    // Detectar si estamos en desktop para alternar entre modal y drawer
    const isDesktop = useMediaQuery("(min-width: 768px)");

    useEffect(() => {
        fetchTransfers();
    }, []);

    useEffect(() => {
        if (selectedTransferId) {
            fetchTransferDetail(selectedTransferId);
        } else {
            setTransferDetail(null);
        }
    }, [selectedTransferId]);

    const fetchTransfers = async () => {
        setIsLoading(true);
        try {
            const data = await getInventoryTransfers();
            setTransfers(data || []);
        } catch (error) {
            console.error("Error al obtener transferencias:", error);
            toast.error("Error al cargar la bitácora de transferencias.");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTransferDetail = async (id: string) => {
        setIsLoadingDetail(true);
        try {
            const data = await getInventoryTransferById(id);
            setTransferDetail(data);
        } catch (error) {
            console.error("Error al obtener detalle de transferencia:", error);
            toast.error("No se pudo cargar el detalle de la transferencia.");
            setSelectedTransferId(null);
        } finally {
            setIsLoadingDetail(false);
        }
    };

    // Procesar la finalización o cancelación de una transferencia
    const handleConfirmAction = async () => {
        if (!actionTarget) return;
        setIsProcessingAction(true);
        try {
            let res;
            if (actionTarget.type === 'complete') {
                res = await completeInventoryTransfer(actionTarget.id);
            } else {
                res = await cancelInventoryTransfer(actionTarget.id);
            }

            if (res.success) {
                toast.success(res.message);
                fetchTransfers();
                // Si el modal de detalle está abierto con esta transferencia, recargarlo o cerrarlo
                if (selectedTransferId === actionTarget.id) {
                    setSelectedTransferId(null);
                }
                setActionTarget(null);
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            console.error("Error al procesar acción de transferencia:", error);
            toast.error("Ocurrió un error inesperado al procesar la solicitud.");
        } finally {
            setIsProcessingAction(false);
        }
    };

    const statusLabels: Record<string, { label: string, color: string, bg: string }> = {
        'pending': { label: 'PENDIENTE', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/30' },
        'completed': { label: 'COMPLETADO', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950/30' },
        'canceled': { label: 'CANCELADO', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-950/30' }
    };

    // Filtrado de transferencias
    const filteredTransfers = transfers.filter(t => {
        if (statusFilter === "all") return true;
        return t.status === statusFilter;
    });

    return (
        <div className="space-y-8">
            {/* Cabecera */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black font-heading text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400">
                            <ArrowRightLeft size={32} />
                        </div>
                        Bitácora de Transferencias
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Historial y control de traslados internos de inventario.</p>
                </div>

                <div className="flex gap-3">
                    <Link href="/dashboard/inventory/warehouses">
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
                            <ArrowLeft size={20} />
                            Almacenes
                        </button>
                    </Link>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-750 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={20} />
                        Nueva Transferencia
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex gap-2 bg-slate-100/60 dark:bg-slate-950 p-1.5 rounded-2xl w-fit border border-slate-200/40 dark:border-slate-800/60">
                <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${statusFilter === "all" ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                    Todas
                </button>
                <button
                    onClick={() => setStatusFilter("pending")}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${statusFilter === "pending" ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm" : "text-slate-500 hover:text-slate-850"}`}
                >
                    Pendientes
                </button>
                <button
                    onClick={() => setStatusFilter("completed")}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${statusFilter === "completed" ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-500 hover:text-slate-850"}`}
                >
                    Completadas
                </button>
                <button
                    onClick={() => setStatusFilter("canceled")}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${statusFilter === "canceled" ? "bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm" : "text-slate-500 hover:text-slate-850"}`}
                >
                    Canceladas
                </button>
            </div>

            {/* Listado de Transferencias */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
                </div>
            ) : filteredTransfers.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800/40">
                    <ArrowRightLeft size={64} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Sin transferencias registradas</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">
                        {statusFilter !== "all" 
                            ? "No hay transferencias con el estado seleccionado." 
                            : "Crea una nueva transferencia interna para abastecer tus consultorios o quirófano desde el almacén principal."}
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-850">
                                    <th className="p-4 pl-6">Fecha</th>
                                    <th className="p-4">Origen</th>
                                    <th className="p-4">Destino</th>
                                    <th className="p-4">Creado por</th>
                                    <th className="p-4">Estado</th>
                                    <th className="p-4 text-right pr-6 w-32">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransfers.map((t) => {
                                    const state = statusLabels[t.status] || { label: t.status, color: 'text-slate-500', bg: 'bg-slate-100' };
                                    return (
                                        <tr key={t.id} className="border-b border-slate-50 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-slate-450" />
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">
                                                        {new Date(t.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                                                <Warehouse size={14} className="text-slate-400" />
                                                {t.from_warehouse?.name || 'Cargando...'}
                                            </td>
                                            <td className="p-4 font-black text-slate-850 dark:text-slate-200">
                                                <div className="flex items-center gap-1.5">
                                                    <Warehouse size={14} className="text-slate-400" />
                                                    {t.to_warehouse?.name || 'Cargando...'}
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-500 font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    <User size={14} className="text-slate-400" />
                                                    {t.creator?.full_name || 'Personal'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${state.bg} ${state.color}`}>
                                                    {state.label}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right pr-6">
                                                <button
                                                    onClick={() => setSelectedTransferId(t.id)}
                                                    className="p-2 text-slate-450 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                                                    title="Ver Detalle"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal de Detalle de Transferencia — responsivo con Drawer en mobile */}
            <AnimatePresence>
                {selectedTransferId && isDesktop && (
                    <div key="transfer-detail-backdrop" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedTransferId(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-border/40 dark:border-slate-800"
                        >
                            {/* Cabecera Detalle — desktop */}
                            <div className="p-6 border-b border-border/40 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/60">
                                <div>
                                    <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                                        <Clipboard size={20} className="text-blue-500" />
                                        Detalle de Transferencia
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Consulta la información y productos del traslado.</p>
                                </div>
                                <button onClick={() => setSelectedTransferId(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Contenido del detalle */}
                            <div className="p-6 space-y-6">
                                {isLoadingDetail || !transferDetail ? (
                                    <div className="space-y-3 py-6">
                                        <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                                        <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                                    </div>
                                ) : (
                                    <>
                                        {/* Grid Informativo */}
                                        <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Almacén Origen</span>
                                                <span className="text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1">
                                                    <Warehouse size={14} className="text-slate-400" />
                                                    {transferDetail.from_warehouse?.name}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Almacén Destino</span>
                                                <span className="text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1">
                                                    <Warehouse size={14} className="text-slate-400" />
                                                    {transferDetail.to_warehouse?.name}
                                                </span>
                                            </div>
                                            <div className="space-y-1 pt-2 border-t border-slate-200/40 dark:border-slate-800/40 col-span-2 md:col-span-1">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Fecha de Solicitud</span>
                                                <span className="text-slate-700 dark:text-slate-300 font-medium">
                                                    {new Date(transferDetail.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="space-y-1 pt-2 border-t border-slate-200/40 dark:border-slate-800/40 col-span-2 md:col-span-1">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Estado Actual</span>
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase inline-block ${statusLabels[transferDetail.status]?.bg} ${statusLabels[transferDetail.status]?.color}`}>
                                                    {statusLabels[transferDetail.status]?.label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Detalle de Productos */}
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Productos Desglosados</span>
                                            <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
                                                <table className="w-full text-left">
                                                    <thead>
                                                        <tr className="bg-slate-50 dark:bg-slate-950 font-bold text-[9px] text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
                                                            <th className="p-3 pl-4">Producto</th>
                                                            <th className="p-3">Lote</th>
                                                            <th className="p-3 text-right pr-4">Cantidad</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {transferDetail.items?.map((item: any) => (
                                                            <tr key={item.id} className="border-b border-slate-50 dark:border-slate-800/30">
                                                                <td className="p-3 pl-4 font-bold text-slate-800 dark:text-slate-200">{item.product?.name}</td>
                                                                <td className="p-3 font-mono font-medium text-slate-500">{item.batch?.batch_number || 'N/A'}</td>
                                                                <td className="p-3 text-right pr-4 font-black text-slate-800 dark:text-slate-200">
                                                                    {item.quantity} <span className="text-[10px] text-slate-400 uppercase font-medium">{item.product?.unit || 'und'}</span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Observaciones */}
                                        {transferDetail.notes && (
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Notas / Observaciones</span>
                                                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-650 dark:text-slate-300 flex items-start gap-2">
                                                    <FileText size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                                    <p>{transferDetail.notes}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Botones de acción del detalle */}
                                        {transferDetail.status === 'pending' && (
                                            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                <button
                                                    onClick={() => setActionTarget({ id: transferDetail.id, type: 'cancel' })}
                                                    className="flex-1 px-4 py-3 bg-red-50 dark:bg-red-950/20 text-red-650 hover:bg-red-100/55 dark:text-red-400 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                                                >
                                                    <XCircle size={14} /> Cancelar Transferencia
                                                </button>
                                                <button
                                                    onClick={() => setActionTarget({ id: transferDetail.id, type: 'complete' })}
                                                    className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                                                >
                                                    <CheckCircle2 size={14} /> Completar / Recibir Stock
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Drawer de Detalle de Transferencia — mobile */}
            {!isDesktop && (
                <Drawer.Root open={!!selectedTransferId} onOpenChange={(open) => !open && setSelectedTransferId(null)}>
                    <Drawer.Portal>
                        <Drawer.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
                        <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[2.5rem] mt-24 fixed bottom-0 left-0 right-0 z-[110] focus:outline-none max-h-[96vh] border-t border-slate-200 dark:border-slate-800">
                            {/* Barra de arrastre */}
                            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 my-4" />
                            <div className="px-6 pb-2">
                                <Drawer.Title className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                                    <Clipboard size={22} className="text-blue-500" />
                                    Detalle de Transferencia
                                </Drawer.Title>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Consulta la información y productos del traslado.</p>
                            </div>
                            <div className="flex-1 overflow-y-auto pb-8">
                                {/* Contenido del detalle — mobile */}
                                <div className="p-6 space-y-6">
                                    {isLoadingDetail || !transferDetail ? (
                                        <div className="space-y-3 py-6">
                                            <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                                            <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                                        </div>
                                    ) : (
                                        <>
                                            {/* Grid Informativo */}
                                            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Almacén Origen</span>
                                                    <span className="text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1">
                                                        <Warehouse size={14} className="text-slate-400" />
                                                        {transferDetail.from_warehouse?.name}
                                                    </span>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Almacén Destino</span>
                                                    <span className="text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1">
                                                        <Warehouse size={14} className="text-slate-400" />
                                                        {transferDetail.to_warehouse?.name}
                                                    </span>
                                                </div>
                                                <div className="space-y-1 pt-2 border-t border-slate-200/40 dark:border-slate-800/40 col-span-2">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Fecha de Solicitud</span>
                                                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                                                        {new Date(transferDetail.created_at).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="space-y-1 pt-2 border-t border-slate-200/40 dark:border-slate-800/40 col-span-2">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Estado Actual</span>
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase inline-block ${statusLabels[transferDetail.status]?.bg} ${statusLabels[transferDetail.status]?.color}`}>
                                                        {statusLabels[transferDetail.status]?.label}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Detalle de Productos */}
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Productos Desglosados</span>
                                                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
                                                    <table className="w-full text-left">
                                                        <thead>
                                                            <tr className="bg-slate-50 dark:bg-slate-950 font-bold text-[9px] text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
                                                                <th className="p-3 pl-4">Producto</th>
                                                                <th className="p-3">Lote</th>
                                                                <th className="p-3 text-right pr-4">Cantidad</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {transferDetail.items?.map((item: any) => (
                                                                <tr key={item.id} className="border-b border-slate-50 dark:border-slate-800/30">
                                                                    <td className="p-3 pl-4 font-bold text-slate-800 dark:text-slate-200">{item.product?.name}</td>
                                                                    <td className="p-3 font-mono font-medium text-slate-500">{item.batch?.batch_number || 'N/A'}</td>
                                                                    <td className="p-3 text-right pr-4 font-black text-slate-800 dark:text-slate-200">
                                                                        {item.quantity} <span className="text-[10px] text-slate-400 uppercase font-medium">{item.product?.unit || 'und'}</span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Observaciones */}
                                            {transferDetail.notes && (
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Notas / Observaciones</span>
                                                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-650 dark:text-slate-300 flex items-start gap-2">
                                                        <FileText size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                                        <p>{transferDetail.notes}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Botones de acción del detalle */}
                                            {transferDetail.status === 'pending' && (
                                                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                    <button
                                                        onClick={() => setActionTarget({ id: transferDetail.id, type: 'cancel' })}
                                                        className="flex-1 px-4 py-3 bg-red-50 dark:bg-red-950/20 text-red-650 hover:bg-red-100/55 dark:text-red-400 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                                                    >
                                                        <XCircle size={14} /> Cancelar Transferencia
                                                    </button>
                                                    <button
                                                        onClick={() => setActionTarget({ id: transferDetail.id, type: 'complete' })}
                                                        className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                                                    >
                                                        <CheckCircle2 size={14} /> Completar / Recibir Stock
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </Drawer.Content>
                    </Drawer.Portal>
                </Drawer.Root>
            )}

            {/* Modal de Confirmación de Acción — usa ConfirmationModal que ya maneja Drawer internamente */}
            <ConfirmationModal
                isOpen={!!actionTarget}
                onClose={() => setActionTarget(null)}
                onConfirm={handleConfirmAction}
                title={actionTarget?.type === 'complete' ? '¿Completar Transferencia?' : '¿Cancelar Transferencia?'}
                description={
                    actionTarget?.type === 'complete'
                        ? "Al confirmar, se descontará el stock en el almacén de origen, se ingresará en el almacén de destino (creando los lotes necesarios) y se registrarán dos transacciones en el Kardex. Esta acción no se puede revertir."
                        : "Al confirmar, la transferencia se cancelará de forma definitiva y no podrá completarse en el futuro."
                }
                confirmText="Sí, Confirmar"
                cancelText="No, volver"
                isDestructive={actionTarget?.type === 'cancel'}
                isLoading={isProcessingAction}
            />

            {/* Modal para Crear Transferencia */}
            <TransferModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSaveSuccess={fetchTransfers}
            />
        </div>
    );
}
