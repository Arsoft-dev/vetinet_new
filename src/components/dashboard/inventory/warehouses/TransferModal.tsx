"use client";

import { useState, useEffect } from "react";
import { X, Save, ArrowRightLeft, Plus, Trash2, AlertCircle, Printer, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createInventoryTransfer } from "@/actions/inventory-transfers";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Drawer } from "vaul";

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
}

export function TransferModal({ isOpen, onClose, onSaveSuccess }: TransferModalProps) {
    const supabase = createClient();

    // Catálogos generales
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    // Estados de selección cabecera
    const [fromWarehouseId, setFromWarehouseId] = useState("");
    const [toWarehouseId, setToWarehouseId] = useState("");
    const [notes, setNotes] = useState("");

    // Estados para la carga del ítem actual
    const [selectedProductId, setSelectedProductId] = useState("");
    const [batches, setBatches] = useState<any[]>([]);
    const [selectedBatchId, setSelectedBatchId] = useState("");
    const [availableQuantity, setAvailableQuantity] = useState<number | null>(null);
    const [quantityToTransfer, setQuantityToTransfer] = useState("");

    // Lista de ítems agregados a la transferencia local
    const [itemsList, setItemsList] = useState<any[]>([]);
    
    // Estados de UI/Envío
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingBatches, setIsLoadingBatches] = useState(false);

    const isDesktop = useMediaQuery("(min-width: 768px)");

    // Cargar catálogos iniciales
    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
            // Resetear estados locales
            setFromWarehouseId("");
            setToWarehouseId("");
            setNotes("");
            setItemsList([]);
            resetItemSelector();
        }
    }, [isOpen]);

    // Cargar lotes si cambia el almacén de origen o el producto
    useEffect(() => {
        if (fromWarehouseId && selectedProductId) {
            fetchBatchesForProduct(selectedProductId, fromWarehouseId);
        } else {
            setBatches([]);
            setSelectedBatchId("");
            setAvailableQuantity(null);
        }
    }, [selectedProductId, fromWarehouseId]);

    // Cargar cantidad disponible del lote seleccionado
    useEffect(() => {
        if (selectedBatchId) {
            const batch = batches.find(b => b.id === selectedBatchId);
            if (batch) {
                setAvailableQuantity(Number(batch.quantity));
            } else {
                setAvailableQuantity(null);
            }
        } else {
            setAvailableQuantity(null);
        }
    }, [selectedBatchId, batches]);

    const resetItemSelector = () => {
        setSelectedProductId("");
        setBatches([]);
        setSelectedBatchId("");
        setAvailableQuantity(null);
        setQuantityToTransfer("");
    };

    const fetchInitialData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: member } = await supabase
            .from("clinic_members")
            .select("clinic_id")
            .eq("user_id", user.id)
            .single();

        if (member) {
            // Almacenes activos
            const { data: whs } = await supabase
                .from("warehouses")
                .select("id, name, type")
                .eq("clinic_id", member.clinic_id)
                .eq("is_active", true)
                .order("name");
            setWarehouses(whs || []);

            // Productos
            const { data: prods } = await supabase
                .from("products")
                .select("id, name, unit, category, barcode")
                .eq("is_archived", false)
                .order("name");
            setProducts(prods || []);
        }
    };

    const fetchBatchesForProduct = async (productId: string, warehouseId: string) => {
        setIsLoadingBatches(true);
        try {
            const { data, error } = await supabase
                .from("inventory_batches")
                .select("id, batch_number, quantity, expiry_date")
                .eq("product_id", productId)
                .eq("warehouse_id", warehouseId)
                .gt("quantity", 0)
                .order("expiry_date", { ascending: true, nullsFirst: false }); // FEFO por defecto

            if (error) throw error;
            setBatches(data || []);
            
            if (data && data.length > 0) {
                // Auto-seleccionar primer lote (más cercano a vencer por FEFO)
                setSelectedBatchId(data[0].id);
            } else {
                setSelectedBatchId("");
            }
        } catch (err) {
            console.error("Error fetching batches:", err);
            toast.error("Error al obtener los lotes del producto.");
        } finally {
            setIsLoadingBatches(false);
        }
    };

    // Función para manejar el escaneo o entrada manual de códigos de barras en transferencias
    const handleBarcodeScan = async (barcode: string) => {
        if (!fromWarehouseId) {
            toast.error("Selecciona primero el almacén de origen.");
            return;
        }

        const prod = products.find(p => p.barcode === barcode);
        if (!prod) {
            toast.error(`Producto con código de barras "${barcode}" no registrado en el catálogo.`);
            return;
        }

        // Buscar lotes de ese producto en el almacén de origen (FEFO)
        toast.loading("Buscando lote disponible...", { id: "barcode-search" });
        try {
            const { data: bts, error } = await supabase
                .from("inventory_batches")
                .select("id, batch_number, quantity, expiry_date")
                .eq("product_id", prod.id)
                .eq("warehouse_id", fromWarehouseId)
                .gt("quantity", 0)
                .order("expiry_date", { ascending: true, nullsFirst: false });

            if (error) throw error;

            if (!bts || bts.length === 0) {
                toast.error(`El producto "${prod.name}" no tiene existencias disponibles en el almacén de origen.`, { id: "barcode-search" });
                return;
            }

            const targetBatch = bts[0]; // Primer lote disponible según FEFO
            const maxQty = Number(targetBatch.quantity);

            // Verificar si este lote ya está en la lista de transferencia local
            const existingIndex = itemsList.findIndex(item => item.batchId === targetBatch.id);

            if (existingIndex >= 0) {
                const currentQty = itemsList[existingIndex].quantity;
                if (currentQty + 1 > maxQty) {
                    toast.error(`No puedes agregar más unidades. El lote solo tiene ${maxQty} ${prod.unit || 'und'} disponibles.`, { id: "barcode-search" });
                    return;
                }

                const updatedList = [...itemsList];
                updatedList[existingIndex].quantity = currentQty + 1;
                setItemsList(updatedList);
                toast.success(`Incrementado a ${currentQty + 1} unidades de ${prod.name}`, { id: "barcode-search" });
            } else {
                setItemsList([...itemsList, {
                    productId: prod.id,
                    productName: prod.name,
                    productUnit: prod.unit || 'und',
                    batchId: targetBatch.id,
                    batchNumber: targetBatch.batch_number,
                    quantity: 1
                }]);
                toast.success(`Agregado a la lista: ${prod.name} (Lote: ${targetBatch.batch_number})`, { id: "barcode-search" });
            }
        } catch (err) {
            console.error("Error al escanear producto en transferencia:", err);
            toast.error("Error al buscar lotes del producto escaneado.", { id: "barcode-search" });
        }
    };

    // Activar el escáner global en el modal de transferencias
    useBarcodeScanner({
        onScan: (barcode) => {
            handleBarcodeScan(barcode);
        },
        enabled: isOpen && !!fromWarehouseId
    });

    // Agregar ítem a la lista de transferencia local
    const handleAddItem = () => {
        if (!selectedProductId || !selectedBatchId || !quantityToTransfer) {
            toast.error("Por favor completa los detalles del producto y lote.");
            return;
        }

        const qty = parseFloat(quantityToTransfer);
        if (isNaN(qty) || qty <= 0) {
            toast.error("La cantidad a transferir debe ser mayor a cero.");
            return;
        }

        if (availableQuantity !== null && qty > availableQuantity) {
            toast.error("No puedes transferir más de la cantidad disponible en el lote.");
            return;
        }

        // Validar si ya se agregó este mismo lote en la lista
        const exists = itemsList.some(item => item.batchId === selectedBatchId);
        if (exists) {
            toast.error("Este lote ya fue agregado. Elimínalo e ingresa la cantidad total consolidada.");
            return;
        }

        const prod = products.find(p => p.id === selectedProductId);
        const batch = batches.find(b => b.id === selectedBatchId);

        setItemsList([...itemsList, {
            productId: selectedProductId,
            productName: prod.name,
            productUnit: prod.unit || 'und',
            batchId: selectedBatchId,
            batchNumber: batch.batch_number,
            quantity: qty
        }]);

        resetItemSelector();
    };

    // Eliminar ítem de la lista local
    const handleRemoveItem = (index: number) => {
        setItemsList(itemsList.filter((_, i) => i !== index));
    };

    // Guardar transferencia en backend
    const handleSubmitTransfer = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fromWarehouseId) return toast.error("Selecciona el almacén de origen.");
        if (!toWarehouseId) return toast.error("Selecciona el almacén de destino.");
        if (fromWarehouseId === toWarehouseId) return toast.error("El origen y el destino no pueden ser iguales.");
        if (itemsList.length === 0) return toast.error("Debes agregar al menos un producto a transferir.");

        setIsSubmitting(true);
        try {
            const data = {
                fromWarehouseId,
                toWarehouseId,
                notes,
                items: itemsList.map(it => ({
                    productId: it.productId,
                    batchId: it.batchId,
                    quantity: it.quantity
                }))
            };

            const res = await createInventoryTransfer(data);
            if (res.success) {
                toast.success(res.message);
                onSaveSuccess();
                onClose();
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            console.error("Error al registrar transferencia:", error);
            toast.error("Ocurrió un error inesperado al registrar la transferencia.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const ModalFormContent = (
        <div className="space-y-5">
            {/* 1. SECCIÓN: ORIGEN Y DESTINO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-[20px] border border-slate-100 dark:border-slate-800/40">
                {/* Almacén Origen */}
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Almacén Origen *</label>
                    <select
                        required
                        value={fromWarehouseId}
                        onChange={(e) => {
                            setFromWarehouseId(e.target.value);
                            if (itemsList.length > 0) {
                                toast.warning("Se ha limpiado la lista de productos porque cambiaste el almacén de origen.");
                            }
                            setItemsList([]);
                            resetItemSelector();
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-xs text-slate-800 dark:text-slate-100 transition-all cursor-pointer"
                    >
                        <option value="">Selecciona origen...</option>
                        {warehouses.map(wh => (
                            <option key={wh.id} value={wh.id}>{wh.name}</option>
                        ))}
                    </select>
                </div>

                {/* Almacén Destino */}
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Almacén Destino *</label>
                    <select
                        required
                        value={toWarehouseId}
                        onChange={(e) => setToWarehouseId(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-xs text-slate-800 dark:text-slate-100 transition-all cursor-pointer"
                    >
                        <option value="">Selecciona destino...</option>
                        {warehouses.filter(wh => wh.id !== fromWarehouseId).map(wh => (
                            <option key={wh.id} value={wh.id}>{wh.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 2. AGREGAR PRODUCTOS */}
            <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-[20px] border border-slate-100 dark:border-slate-800/40">
                    <div className="space-y-0.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-0.5">Entrada Rápida por Código de Barras</span>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">Escanea o ingresa el código del producto a transferir.</p>
                    </div>
                    <div className="relative w-full sm:w-80">
                        <input
                            type="text"
                            data-barcode-capture="true"
                            disabled={!fromWarehouseId}
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
                            className="w-full pl-4 pr-12 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs font-mono font-bold transition-all text-slate-800 dark:text-slate-100 disabled:opacity-50"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-black text-slate-400 pointer-events-none">ENTER</span>
                    </div>
                </div>
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Seleccionar Productos y Lotes manualmente</h3>
                
                {!fromWarehouseId ? (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-100 dark:border-amber-900/30 text-[11px] font-bold leading-relaxed">
                        <AlertCircle size={14} className="flex-shrink-0" />
                        Selecciona primero un almacén de origen para cargar sus lotes y stock disponible.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-50/50 dark:bg-slate-950/20 p-3.5 rounded-[20px] border border-slate-100 dark:border-slate-800/20">
                        {/* Producto */}
                        <div className="md:col-span-5 space-y-1 w-full">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-0.5">Producto</label>
                            <select
                                value={selectedProductId}
                                onChange={(e) => setSelectedProductId(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-xs text-slate-800 dark:text-slate-100 transition-all cursor-pointer"
                            >
                                <option value="">Buscar producto...</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Lote */}
                        <div className="md:col-span-3 space-y-1 w-full">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-0.5">Lote Disponible (FEFO)</label>
                            <select
                                disabled={isLoadingBatches || batches.length === 0}
                                value={selectedBatchId}
                                onChange={(e) => setSelectedBatchId(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-xs text-slate-800 dark:text-slate-100 transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {isLoadingBatches ? (
                                    <option>Cargando lotes...</option>
                                ) : batches.length === 0 ? (
                                    <option>Sin lotes en origen</option>
                                ) : (
                                    batches.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.batch_number} {b.expiry_date ? `(Vence: ${new Date(b.expiry_date).toLocaleDateString()})` : '(Sin Vence.)'}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        {/* Cantidad */}
                        <div className="md:col-span-2 space-y-1 w-full">
                            <div className="flex justify-between items-center px-0.5">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Cantidad</label>
                                {availableQuantity !== null && (
                                    <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400">
                                        (Dispo: {availableQuantity})
                                    </span>
                                )}
                            </div>
                            <input
                                type="number"
                                step="any"
                                value={quantityToTransfer}
                                onChange={(e) => setQuantityToTransfer(e.target.value)}
                                placeholder="0.00"
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-xs text-slate-800 dark:text-slate-100 transition-all"
                            />
                        </div>

                        {/* Botón Añadir */}
                        <div className="md:col-span-2 w-full">
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="w-full py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl font-black text-[10px] uppercase tracking-wider border border-blue-200/45 dark:border-blue-900/30 transition-all flex items-center justify-center gap-1"
                            >
                                <Plus size={12} /> Agregar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. TABLA DE PRODUCTOS A TRANSFERIR con Scroll Horizontal Táctil */}
            <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Productos en esta transferencia</label>
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl overflow-hidden max-h-[220px] w-full overflow-x-auto scrollbar-thin">
                    <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                        <thead className="sticky top-0 bg-slate-50 dark:bg-slate-950 z-10">
                            <tr className="text-slate-400 font-bold uppercase tracking-wider text-[9px] border-b border-slate-150 dark:border-slate-850">
                                <th className="p-3 pl-4">Producto</th>
                                <th className="p-3">Número de Lote</th>
                                <th className="p-3 text-right">Cantidad</th>
                                <th className="p-3 text-center w-14">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemsList.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-400 font-medium italic">
                                        Ningún producto agregado aún. Selecciona un producto y lote de arriba o escanea su código.
                                    </td>
                                </tr>
                            ) : (
                                itemsList.map((item, index) => (
                                    <tr key={index} className="border-b border-slate-50 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                                        <td className="p-3 pl-4 font-bold text-slate-800 dark:text-slate-200">{item.productName}</td>
                                        <td className="p-3 font-mono font-medium text-slate-550 dark:text-slate-400">{item.batchNumber}</td>
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

            {/* 4. NOTAS */}
            <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Observaciones / Notas Internas</label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Indica el motivo del traslado (ej: recarga de inventario mensual, reubicación de lotes...)"
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium text-xs text-slate-800 dark:text-slate-100 transition-all resize-none animate-none"
                />
            </div>
        </div>
    );

    const ModalFooter = (
        <div className="flex gap-3 w-full">
            <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
                Cancelar
            </button>
            <button
                type="button"
                onClick={handleSubmitTransfer}
                disabled={isSubmitting || itemsList.length === 0}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-750 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Save size={12} />
                {isSubmitting ? "Registrando..." : "Registrar Transferencia"}
            </button>
        </div>
    );

    if (isDesktop) {
        return (
            <AnimatePresence>
                {isOpen && (
                    <div key="transfer-modal-backdrop" className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden border border-border/40 dark:border-slate-800 flex flex-col max-h-[90vh]"
                        >
                            {/* Encabezado Fijo */}
                            <div className="p-5 border-b border-border/40 dark:border-slate-800 flex justify-between items-center bg-blue-50/20 dark:bg-slate-800/30 flex-shrink-0">
                                <div>
                                    <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                                        <ArrowRightLeft size={20} className="text-blue-500" />
                                        Nueva Transferencia Interna de Stock
                                    </h2>
                                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                        Mueve mercancías de forma segura y controlada entre ubicaciones físicas de tu clínica.
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

                            {/* Pie de Página Fijo con Botones */}
                            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex bg-slate-50/50 dark:bg-slate-950/40 flex-shrink-0">
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
                    <Drawer.Title className="sr-only">Nueva Transferencia de Stock</Drawer.Title>
                    <Drawer.Description className="sr-only">Formulario para registrar una transferencia interna de stock entre almacenes.</Drawer.Description>
                    
                    <div className="px-6 py-2 border-b border-border/40 dark:border-slate-800">
                        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                            <ArrowRightLeft size={20} className="text-blue-500" />
                            Nueva Transferencia
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
