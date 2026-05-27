"use client";

import { useState, useEffect } from "react";
import { X, Save, ClipboardCheck, AlertTriangle, CheckCircle2, FileText, User, Warehouse, Printer, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getInventoryAuditById, updateInventoryAuditItems, confirmInventoryAudit, cancelInventoryAudit } from "@/actions/inventory-audits";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Drawer } from "vaul";

const reasonLabels: Record<string, string> = {
    'counting_error': 'Error de Conteo / Rectificación',
    'clinical_omission': 'Omisión de Registro Clínico',
    'damaged_expired': 'Producto Dañado / Vencido',
    'unexplained_loss': 'Pérdida Inexplicable / Hurto',
    'unexplained_surplus': 'Sobrante Inexplicable'
};

interface AuditDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    auditId: string;
    onSaveSuccess: () => void;
}

export function AuditDetailModal({ isOpen, onClose, auditId, onSaveSuccess }: AuditDetailModalProps) {
    const isDesktop = useMediaQuery("(min-width: 1024px)");
    const [auditDetail, setAuditDetail] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Estado local para los conteos reales editables
    const [counts, setCounts] = useState<Record<string, number>>({});
    // Estado local para los motivos de discrepancia
    const [reasons, setReasons] = useState<Record<string, string>>({});
    
    // Estado para destacar el item escaneado recientemente
    const [scannedItemId, setScannedItemId] = useState<string | null>(null);

    // Estados de UI/Confirmación de acciones
    const [isSavingBorrador, setIsSavingBorrador] = useState(false);
    const [actionTarget, setActionTarget] = useState<'confirm' | 'cancel' | null>(null);
    const [isProcessingAction, setIsProcessingAction] = useState(false);

    useEffect(() => {
        if (isOpen && auditId) {
            fetchDetail();
        } else {
            setAuditDetail(null);
            setCounts({});
            setReasons({});
            setActionTarget(null);
        }
    }, [isOpen, auditId]);

    const fetchDetail = async () => {
        setIsLoading(true);
        try {
            const data = await getInventoryAuditById(auditId);
            setAuditDetail(data);
            
            if (data && data.items) {
                // Inicializar mapa de conteos locales y motivos
                const initialCounts: Record<string, number> = {};
                const initialReasons: Record<string, string> = {};
                data.items.forEach((item: any) => {
                    initialCounts[item.id] = Number(item.actual_quantity);
                    initialReasons[item.id] = item.discrepancy_reason || "";
                });
                setCounts(initialCounts);
                setReasons(initialReasons);
            }
        } catch (error) {
            console.error("Error al obtener detalle de la auditoría:", error);
            toast.error("No se pudo cargar la información de la toma física.");
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const handleCountChange = (itemId: string, val: string) => {
        const parsed = parseFloat(val);
        setCounts(prev => ({
            ...prev,
            [itemId]: isNaN(parsed) || parsed < 0 ? 0 : parsed
        }));
    };

    const handleReasonChange = (itemId: string, val: string) => {
        setReasons(prev => ({
            ...prev,
            [itemId]: val
        }));
    };

    // Función para manejar el escaneo o entrada rápida de códigos de barras
    const handleBarcodeScan = (barcode: string) => {
        const foundItem = auditDetail?.items?.find((item: any) => item.product?.barcode === barcode);
        if (foundItem) {
            const currentVal = counts[foundItem.id] !== undefined ? counts[foundItem.id] : Number(foundItem.actual_quantity);
            
            // Sumar +1 al conteo actual
            const newVal = currentVal + 1;
            setCounts(prev => ({
                ...prev,
                [foundItem.id]: newVal
            }));

            // Destacar temporalmente la fila del item escaneado
            setScannedItemId(foundItem.id);
            setTimeout(() => setScannedItemId(null), 1500);

            toast.success(`+1 sumado a: ${foundItem.product?.name}`);
        } else {
            toast.warning(`El producto con código de barras "${barcode}" no pertenece a los ítems congelados de esta auditoría.`);
        }
    };

    // Registrar el hook global para escáner físico de pistola (Bluetooth/USB)
    useBarcodeScanner({
        onScan: (barcode) => {
            handleBarcodeScan(barcode);
        },
        enabled: isOpen && auditDetail?.status === "draft"
    });

    const handleSaveBorrador = async () => {
        setIsSavingBorrador(true);
        try {
            // Mapear los counts locales al formato esperado por el backend
            const itemsToUpdate = Object.keys(counts).map(id => ({
                id,
                actualQuantity: counts[id],
                discrepancyReason: reasons[id] || null
            }));

            const res = await updateInventoryAuditItems(auditId, itemsToUpdate);
            if (res.success) {
                toast.success("Borrador guardado exitosamente.");
                fetchDetail(); // Recargar datos
                onSaveSuccess();
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            console.error("Error al guardar borrador:", error);
            toast.error("Ocurrió un error inesperado al guardar el borrador.");
        } finally {
            setIsSavingBorrador(false);
        }
    };

    const handleConfirmAction = async () => {
        if (!actionTarget) return;

        setIsProcessingAction(true);
        try {
            if (actionTarget === 'confirm') {
                // Primero guardamos el conteo actual por seguridad
                const itemsToUpdate = Object.keys(counts).map(id => ({
                    id,
                    actualQuantity: counts[id],
                    discrepancyReason: reasons[id] || null
                }));
                await updateInventoryAuditItems(auditId, itemsToUpdate);

                // Confirmar y aplicar discrepancias físicas
                const res = await confirmInventoryAudit(auditId);
                if (res.success) {
                    toast.success(res.message);
                    onSaveSuccess();
                    onClose();
                } else {
                    toast.error(res.message);
                }
            } else if (actionTarget === 'cancel') {
                const res = await cancelInventoryAudit(auditId);
                if (res.success) {
                    toast.success(res.message);
                    onSaveSuccess();
                    onClose();
                } else {
                    toast.error(res.message);
                }
            }
        } catch (error) {
            console.error(`Error al procesar acción ${actionTarget}:`, error);
            toast.error("Ocurrió un error al procesar la acción.");
        } finally {
            setIsProcessingAction(false);
            setActionTarget(null);
        }
    };

    const statusLabels: Record<string, { label: string, color: string, bg: string }> = {
        'draft': { label: 'BORRADOR', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/30' },
        'confirmed': { label: 'CONFIRMADA', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950/30' },
        'canceled': { label: 'CANCELADA', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-950/30' }
    };

    if (!isOpen) return null;

    const isEditable = auditDetail?.status === "draft";

    const HeaderContent = (
        <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <ClipboardCheck size={20} className="text-amber-500" />
                {isEditable ? "Realizar Toma Física / Conteo" : "Detalle de Auditoría"}
            </h2>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {isEditable ? "Introduce las cantidades físicas que encontraste en las estanterías." : "Consulta la información y discrepancias consolidadas en este inventario físico."}
            </p>
        </div>
    );

    const ModalBody = (
        <div className="p-6 overflow-y-auto space-y-5 flex-1 min-h-0 custom-scrollbar dark:bg-slate-900">
            {isLoading || !auditDetail ? (
                <div className="space-y-4 py-8">
                    <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                    <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                </div>
            ) : (
                <>
                    {/* Grid Informativo */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-[20px] border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <div className="space-y-0.5 col-span-2 md:col-span-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Almacén Auditado</span>
                            <span className="text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1">
                                <Warehouse size={14} className="text-slate-400" />
                                {auditDetail.warehouse?.name || "General"}
                            </span>
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Fecha de Inicio</span>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">
                                {new Date(auditDetail.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Responsable</span>
                            <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                                <User size={14} className="text-slate-400" />
                                {auditDetail.user?.full_name || "Sistema"}
                            </span>
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Estado de Auditoría</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase inline-block ${statusLabels[auditDetail.status]?.bg} ${statusLabels[auditDetail.status]?.color}`}>
                                {statusLabels[auditDetail.status]?.label}
                            </span>
                        </div>
                    </div>

                    {/* Entrada Rápida de Código de Barras (Escáner/Teclado) */}
                    {isEditable && (
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-[20px] border border-slate-100 dark:border-slate-800/80 space-y-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="space-y-0.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-0.5">Entrada Rápida por Código de Barras</span>
                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Escanea o ingresa un código de barras para añadir una unidad al conteo.</p>
                            </div>
                            <div className="relative w-full sm:w-80">
                                <input
                                    type="text"
                                    data-barcode-capture="true"
                                    placeholder="Escanea o escribe el código..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const barcode = e.currentTarget.value.trim();
                                            if (barcode) {
                                                handleBarcodeScan(barcode);
                                                e.currentTarget.value = ""; // Limpiar input
                                            }
                                        }
                                    }}
                                    className="w-full pl-4 pr-12 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-xs font-mono font-bold transition-all text-slate-800 dark:text-slate-100"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-black text-slate-400 pointer-events-none">ENTER</span>
                            </div>
                        </div>
                    )}

                    {/* Tabla de Detalle e Inputs con scroll horizontal táctil premium */}
                    <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-0.5 font-heading">Listado de Stock y Lotes</span>
                        
                        <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-x-auto max-w-full text-xs scrolling-touch">
                            <table className="w-full text-left border-collapse min-w-[750px]">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-950 font-bold text-[9px] text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800 tracking-wider">
                                        <th className="p-3 pl-4">Producto</th>
                                        <th className="p-3">Lote</th>
                                        <th className="p-3 text-right">Esperado (Sis)</th>
                                        <th className="p-3 text-right w-28">Contado (Real)</th>
                                        <th className="p-3 text-right pr-4 w-28">Discrepancia</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditDetail.items?.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-slate-450 italic font-medium">
                                                No hay productos registrados en este almacén.
                                            </td>
                                        </tr>
                                    ) : (
                                        auditDetail.items.map((item: any) => {
                                            const expected = Number(item.expected_quantity);
                                            const counted = counts[item.id] !== undefined ? counts[item.id] : Number(item.actual_quantity);
                                            const discrepancy = counted - expected;

                                            return (
                                                <tr 
                                                    key={item.id} 
                                                    className={`border-b border-slate-50 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-all duration-300 ${
                                                        scannedItemId === item.id 
                                                            ? 'bg-emerald-50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20' 
                                                            : ''
                                                    }`}
                                                >
                                                    <td className="p-3 pl-4">
                                                        <div className="font-bold text-slate-800 dark:text-slate-200">{item.product?.name}</div>
                                                        {item.product?.barcode && (
                                                            <span className="text-[10px] text-slate-400 font-mono block">Barcode: {item.product.barcode}</span>
                                                        )}
                                                        {/* Diagnóstico inteligente y selector de causa raíz */}
                                                        {discrepancy !== 0 && (
                                                            <div className="mt-2 p-2 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5 max-w-sm">
                                                                <div className="flex items-start gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                                                    <Lightbulb size={12} className="mt-0.5 flex-shrink-0" />
                                                                    <span>{item.suggested_pista}</span>
                                                                </div>
                                                                {isEditable ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[9px] font-black uppercase text-slate-400">Causa:</span>
                                                                        <select
                                                                            value={reasons[item.id] || ""}
                                                                            onChange={(e) => handleReasonChange(item.id, e.target.value)}
                                                                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-350 outline-none focus:ring-1 focus:ring-amber-500/20 cursor-pointer"
                                                                        >
                                                                            <option value="">-- Seleccionar Causa --</option>
                                                                            <option value="counting_error">Error de Conteo / Rectificación</option>
                                                                            <option value="clinical_omission">Omisión de Registro Clínico</option>
                                                                            <option value="damaged_expired">Producto Dañado / Vencido</option>
                                                                            {discrepancy < 0 ? (
                                                                                <option value="unexplained_loss">Pérdida Inexplicable / Hurto</option>
                                                                            ) : (
                                                                                <option value="unexplained_surplus">Sobrante Inexplicable</option>
                                                                            )}
                                                                        </select>
                                                                    </div>
                                                                ) : (
                                                                    item.discrepancy_reason && (
                                                                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                                                            Causa raíz: <span className="font-bold text-slate-700 dark:text-slate-350">{reasonLabels[item.discrepancy_reason] || item.discrepancy_reason}</span>
                                                                        </div>
                                                                    )
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-3 font-mono font-medium text-slate-500">
                                                        {item.batch?.batch_number || "GENÉRICO"}
                                                    </td>
                                                    <td className="p-3 text-right font-bold text-slate-700 dark:text-slate-350">
                                                        {expected} <span className="text-[10px] text-slate-400 font-medium lowercase">{item.product?.unit || 'u'}</span>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        {isEditable ? (
                                                            <input
                                                                type="number"
                                                                step="any"
                                                                value={counts[item.id] ?? ""}
                                                                onChange={(e) => handleCountChange(item.id, e.target.value)}
                                                                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-bold text-right text-xs text-slate-800 dark:text-slate-100 transition-all"
                                                            />
                                                        ) : (
                                                            <span className="font-bold text-slate-700 dark:text-slate-350">
                                                                {counted} <span className="text-[10px] text-slate-400 font-medium lowercase">{item.product?.unit || 'u'}</span>
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-right pr-4">
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wider ${
                                                                discrepancy === 0 
                                                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' 
                                                                    : discrepancy > 0 
                                                                        ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' 
                                                                        : 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                                                            }`}>
                                                                {discrepancy === 0 ? "0" : discrepancy > 0 ? `+${discrepancy}` : discrepancy}
                                                            </span>
                                                            {discrepancy !== 0 && (
                                                                <span className={`text-[10px] font-bold ${discrepancy > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                                    {discrepancy > 0 ? `+$${(discrepancy * Number(item.product?.sale_price || 0)).toFixed(2)}` : `-$${Math.abs(discrepancy * Number(item.product?.sale_price || 0)).toFixed(2)}`}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Observaciones */}
                    {auditDetail.notes && (
                        <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-0.5">Notas de la Auditoría</span>
                            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-650 dark:text-slate-350 flex items-start gap-2">
                                <FileText size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                <p>{auditDetail.notes}</p>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );

    const ModalFooter = (
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-3 bg-slate-50/50 dark:bg-slate-950/40 flex-shrink-0 justify-end items-center">
            {isEditable ? (
                <>
                    <button
                        type="button"
                        onClick={() => setActionTarget('cancel')}
                        className="px-4 py-2.5 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 hover:bg-red-100/50 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all"
                    >
                        Cancelar Toma
                    </button>
                    <a
                        href={`/print/inventory-audit/${auditId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-1.5"
                    >
                        Hoja de Trabajo
                    </a>
                    <button
                        type="button"
                        onClick={handleSaveBorrador}
                        disabled={isSavingBorrador}
                        className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                        {isSavingBorrador ? "Guardando..." : "Guardar Borrador"}
                    </button>
                    <button
                        type="button"
                        onClick={() => setActionTarget('confirm')}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
                    >
                        <CheckCircle2 size={12} /> Confirmar Stock
                    </button>
                </>
            ) : (
                <div className="flex justify-between items-center w-full">
                    <a
                        href={`/print/inventory-audit/${auditId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-100 transition-all flex items-center gap-2 shadow-lg"
                    >
                        Imprimir Reporte
                    </a>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                        Cerrar Ventana
                    </button>
                </div>
            )}
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
                            className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden border border-border/40 dark:border-slate-800 flex flex-col max-h-[90vh]"
                        >
                            {/* Encabezado Fijo */}
                            <div className="p-5 border-b border-border/40 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/60 flex-shrink-0">
                                {HeaderContent}
                                <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                                    <X size={18} />
                                </button>
                            </div>

                            {ModalBody}
                            {ModalFooter}
                        </motion.div>
                    </div>
                )}

                {/* Confirm Action Dialog */}
                {actionTarget && (
                    <div key="action-confirm-backdrop" className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] p-6 border border-border/40 dark:border-slate-800 shadow-2xl"
                        >
                            <div className={`flex items-center gap-3 mb-4 ${actionTarget === 'confirm' ? 'text-emerald-650 dark:text-emerald-400' : 'text-red-650 dark:text-red-400'}`}>
                                <div className={`p-3 rounded-2xl ${actionTarget === 'confirm' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                    <AlertTriangle size={24} />
                                </div>
                                <h3 className="text-lg font-black tracking-tight">
                                    {actionTarget === 'confirm' ? '¿Confirmar Toma Física?' : '¿Cancelar Auditoría?'}
                                </h3>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed">
                                {actionTarget === 'confirm' 
                                    ? "Al confirmar, se guardarán los conteos reales y se reajustará el stock digital actual en la base de datos para que coincida con los valores contados."
                                    : "Al confirmar la cancelación, la auditoría se cerrará de forma permanente y se descartarán los conteos reales ingresados."}
                            </p>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setActionTarget(null)}
                                    disabled={isProcessingAction}
                                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                                >
                                    No, volver
                                </button>
                                <button
                                    onClick={handleConfirmAction}
                                    disabled={isProcessingAction}
                                    className={`flex-1 px-4 py-3 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center ${
                                        actionTarget === 'confirm' 
                                            ? 'bg-amber-650 hover:bg-amber-700 shadow-lg shadow-amber-500/20' 
                                            : 'bg-red-650 hover:bg-red-700 shadow-lg shadow-red-500/20'
                                    }`}
                                >
                                    {isProcessingAction ? "Procesando..." : "Sí, Confirmar"}
                                </button>
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
                <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[24px] mt-24 fixed bottom-0 left-0 right-0 z-[150] focus:outline-none h-[96vh]">
                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 my-3" />
                    <Drawer.Title className="sr-only">Detalle de Auditoría</Drawer.Title>
                    <Drawer.Description className="sr-only">Detalles y conteo físico del inventario seleccionado.</Drawer.Description>
                    
                    <div className="px-6 py-2 border-b border-border/40 dark:border-slate-800">
                        {HeaderContent}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {ModalBody}
                    </div>
                    {ModalFooter}
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
