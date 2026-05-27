"use client";

import { useState, useEffect } from "react";
import { Plus, Search, ClipboardList, Trash2, ArrowLeft, CheckCircle, XCircle, Clock, User, Warehouse } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { getInventoryRequisitions, createInventoryRequisition, approveInventoryRequisition, rejectInventoryRequisition } from "@/actions/inventory-requisitions";
import { getProducts } from "@/actions/inventory";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Drawer } from "vaul";
import { useMediaQuery } from "@/hooks/use-media-query";

interface RequisitionItemInput {
    productId: string;
    name: string;
    quantity: number;
    unit: string;
}

export default function RequisitionsPage() {
    const [requisitions, setRequisitions] = useState<any[]>([]);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [userRole, setUserRole] = useState("staff");
    const [isLoading, setIsLoading] = useState(true);
    
    // Modal de Creación
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [destinationWarehouseId, setDestinationWarehouseId] = useState("");
    const [notes, setNotes] = useState("");
    const [selectedItems, setSelectedItems] = useState<RequisitionItemInput[]>([]);
    const [productSearch, setProductSearch] = useState("");
    const [productResults, setProductResults] = useState<any[]>([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'reject', id: string } | null>(null);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    // Modal de Detalle
    const [selectedRequisition, setSelectedRequisition] = useState<any | null>(null);

    const supabase = createClient();

    useEffect(() => {
        initData();
    }, []);

    // Debounce búsqueda de productos en modal
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (productSearch.length >= 2) {
                const results = await getProducts(productSearch);
                setProductResults(results.filter((p: any) => !p.is_archived && p.category !== 'Service' && p.category !== 'Other'));
            } else {
                setProductResults([]);
            }
        }, 250);
        return () => clearTimeout(timer);
    }, [productSearch]);

    const initData = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Obtener rol y clínica
            const { data: member } = await supabase
                .from("clinic_members")
                .select("clinic_id, role")
                .eq("user_id", user.id)
                .single();

            if (member) {
                setUserRole(member.role);
                
                // 2. Cargar Requisiciones
                const reqs = await getInventoryRequisitions();
                setRequisitions(reqs);

                // 3. Cargar Almacenes de destino (solo tipo 'consulting' para veterinarios; todos para admin)
                let whQuery = supabase
                    .from("warehouses")
                    .select("*")
                    .eq("clinic_id", member.clinic_id)
                    .eq("is_active", true);
                
                if (member.role === 'vet') {
                    whQuery = whQuery.eq("type", "consulting");
                }
                
                const { data: whs } = await whQuery.order("name");
                setWarehouses(whs || []);
                if (whs && whs.length > 0) {
                    setDestinationWarehouseId(whs[0].id);
                }
            }
        } catch (err) {
            console.error("Error al cargar datos de requisiciones:", err);
            toast.error("Ocurrió un error al inicializar las requisiciones.");
        } finally {
            setIsLoading(false);
        }
    };

    // Agregar ítem a la lista de requisición
    const handleAddProduct = (product: any) => {
        const existing = selectedItems.find(i => i.productId === product.id);
        if (existing) {
            toast.info(`${product.name} ya está en la lista.`);
            return;
        }
        setSelectedItems(prev => [...prev, {
            productId: product.id,
            name: product.name,
            quantity: 1,
            unit: product.unit
        }]);
        setProductSearch("");
        setProductResults([]);
    };

    // Actualizar cantidad de ítem
    const handleUpdateQty = (productId: string, qty: number) => {
        if (qty <= 0) return;
        setSelectedItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i));
    };

    // Remover ítem
    const handleRemoveItem = (productId: string) => {
        setSelectedItems(prev => prev.filter(i => i.productId !== productId));
    };

    // Crear Requisición
    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedItems.length === 0) {
            toast.error("Debes agregar al menos un producto a solicitar.");
            return;
        }

        setActionLoading(true);
        try {
            const res = await createInventoryRequisition({
                destinationWarehouseId,
                notes,
                items: selectedItems.map(i => ({ productId: i.productId, quantity: i.quantity }))
            });

            if (res.success) {
                toast.success(res.message);
                setIsCreateOpen(false);
                setNotes("");
                setSelectedItems([]);
                initData();
            } else {
                toast.error(res.message);
            }
        } catch (err: any) {
            toast.error("Error al procesar la solicitud.");
        } finally {
            setActionLoading(false);
        }
    };

    // Aprobar Requisición (Admin)
    const handleApprove = (id: string) => {
        setConfirmAction({ type: 'approve', id });
    };

    const executeApprove = async (id: string) => {
        const toastId = toast.loading("Procesando aprobación y moviendo stock...");
        try {
            const res = await approveInventoryRequisition(id);
            if (res.success) {
                toast.success(res.message, { id: toastId });
                initData();
                if (selectedRequisition?.id === id) {
                    setSelectedRequisition(null);
                }
            } else {
                toast.error(res.message, { id: toastId });
            }
        } catch (err: any) {
            toast.error("Error al aprobar la requisición.", { id: toastId });
        } finally {
            setConfirmAction(null);
        }
    };

    // Rechazar Requisición (Admin)
    const handleReject = (id: string) => {
        setConfirmAction({ type: 'reject', id });
    };

    const executeReject = async (id: string) => {
        setActionLoading(true);
        try {
            const res = await rejectInventoryRequisition(id);
            if (res.success) {
                toast.success(res.message);
                initData();
                if (selectedRequisition?.id === id) {
                    setSelectedRequisition(null);
                }
            } else {
                toast.error(res.message);
            }
        } catch (err) {
            toast.error("Error al rechazar la requisición.");
        } finally {
            setActionLoading(false);
            setConfirmAction(null);
        }
    };

    const handleConfirmAction = async () => {
        if (!confirmAction) return;
        if (confirmAction.type === 'approve') {
            await executeApprove(confirmAction.id);
        } else {
            await executeReject(confirmAction.id);
        }
    };

    // Ver detalles de una requisición
    const handleViewDetails = async (requisition: any) => {
        const supabaseAdmin = createClient();
        const { data: items } = await supabaseAdmin
            .from("inventory_requisition_items")
            .select(`
                *,
                product:products(name, unit, barcode)
            `)
            .eq("requisition_id", requisition.id);

        setSelectedRequisition({
            ...requisition,
            items: items || []
        });
    };

    const statusBadges: Record<string, { label: string, color: string, bg: string }> = {
        'pending': { label: 'Pendiente', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100/60 dark:bg-amber-950/20' },
        'approved': { label: 'Aprobada', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100/60 dark:bg-emerald-950/20' },
        'rejected': { label: 'Rechazada', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100/60 dark:bg-red-950/20' }
    };

    return (
        <div className="space-y-8">
            {/* Cabecera */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black font-heading text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400">
                            <ClipboardList size={32} />
                        </div>
                        Solicitudes de Reposición
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                        {userRole === 'vet' 
                            ? "Solicita insumos y medicamentos desde tu consultorio al almacén principal." 
                            : "Gestiona y aprueba las requisiciones de stock solicitadas por el personal clínico."}
                    </p>
                </div>

                <div className="flex gap-3">
                    <Link href="/dashboard/inventory">
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
                            <ArrowLeft size={20} />
                            Volver
                        </button>
                    </Link>
                    {warehouses.length > 0 && (
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                        >
                            <Plus size={20} />
                            Solicitar Reposición
                        </button>
                    )}
                </div>
            </div>

            {/* Listado de Requisiciones */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
                </div>
            ) : requisitions.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800/40">
                    <ClipboardList size={64} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Sin requisiciones</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">
                        Aún no se han registrado solicitudes de reposición en esta clínica.
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800/40 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4">Fecha</th>
                                    <th className="px-6 py-4">Solicitante</th>
                                    <th className="px-6 py-4">Destino</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4">Notas</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {requisitions.map((req) => {
                                    const badge = statusBadges[req.status] || { label: req.status, color: 'text-slate-550', bg: 'bg-slate-50' };
                                    return (
                                        <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 text-slate-500">
                                                {new Date(req.created_at).toLocaleDateString()} {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">
                                                {req.requester?.full_name || "Sistema"}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">
                                                {req.destination_warehouse?.name || "Desconocido"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${badge.bg} ${badge.color}`}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate" title={req.notes}>
                                                {req.notes || "-"}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewDetails(req)}
                                                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors"
                                                    >
                                                        Ver Detalle
                                                    </button>
                                                    {userRole !== 'vet' && req.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(req.id)}
                                                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors border border-emerald-100/50"
                                                                title="Aprobar y Transferir Stock"
                                                            >
                                                                <CheckCircle size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(req.id)}
                                                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-100/50"
                                                                title="Rechazar"
                                                            >
                                                                <XCircle size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            
            {/* Modal de Creación */}
            <AnimatePresence>
                {isCreateOpen && (
                    isDesktop ? (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] overflow-hidden border border-border/40 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh]"
                            >
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                                    <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                        <ClipboardList size={22} className="text-indigo-600" />
                                        Solicitud de Reposición
                                    </h3>
                                    <button
                                        onClick={() => setIsCreateOpen(false)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition-colors text-slate-400"
                                    >
                                        <XCircle size={20} />
                                    </button>
                                </div>

                                <CreateForm 
                                    handleCreateSubmit={handleCreateSubmit}
                                    destinationWarehouseId={destinationWarehouseId}
                                    setDestinationWarehouseId={setDestinationWarehouseId}
                                    warehouses={warehouses}
                                    productSearch={productSearch}
                                    setProductSearch={setProductSearch}
                                    productResults={productResults}
                                    handleAddProduct={handleAddProduct}
                                    selectedItems={selectedItems}
                                    handleUpdateQty={handleUpdateQty}
                                    handleRemoveItem={handleRemoveItem}
                                    notes={notes}
                                    setNotes={setNotes}
                                    actionLoading={actionLoading}
                                />
                            </motion.div>
                        </div>
                    ) : (
                        <Drawer.Root open={isCreateOpen} onOpenChange={(open) => !open && setIsCreateOpen(false)}>
                            <Drawer.Portal>
                                <Drawer.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
                                <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[2.5rem] mt-24 fixed bottom-0 left-0 right-0 z-[110] focus:outline-none max-h-[96vh]">
                                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 my-4" />
                                    <div className="px-6 pb-2">
                                        <Drawer.Title className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                                            <ClipboardList size={24} className="text-indigo-600" />
                                            Solicitud de Reposición
                                        </Drawer.Title>
                                    </div>
                                    <div className="flex-1 overflow-y-auto pb-8">
                                        <CreateForm 
                                            handleCreateSubmit={handleCreateSubmit}
                                            destinationWarehouseId={destinationWarehouseId}
                                            setDestinationWarehouseId={setDestinationWarehouseId}
                                            warehouses={warehouses}
                                            productSearch={productSearch}
                                            setProductSearch={setProductSearch}
                                            productResults={productResults}
                                            handleAddProduct={handleAddProduct}
                                            selectedItems={selectedItems}
                                            handleUpdateQty={handleUpdateQty}
                                            handleRemoveItem={handleRemoveItem}
                                            notes={notes}
                                            setNotes={setNotes}
                                            actionLoading={actionLoading}
                                        />
                                    </div>
                                </Drawer.Content>
                            </Drawer.Portal>
                        </Drawer.Root>
                    )
                )}
            </AnimatePresence>

            {/* Modal de Detalles / Aprobación */}
            <AnimatePresence>
                {selectedRequisition && (
                    isDesktop ? (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedRequisition(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] overflow-hidden border border-border/40 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh]"
                            >
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                                    <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-slate-100">
                                        Detalle de Requisición
                                    </h3>
                                    <button
                                        onClick={() => setSelectedRequisition(null)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition-colors text-slate-400"
                                    >
                                        <XCircle size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    <DetailContent 
                                        selectedRequisition={selectedRequisition} 
                                        statusBadges={statusBadges}
                                        userRole={userRole}
                                        handleReject={handleReject}
                                        handleApprove={handleApprove}
                                    />
                                </div>
                            </motion.div>
                        </div>
                    ) : (
                        <Drawer.Root open={!!selectedRequisition} onOpenChange={(open) => !open && setSelectedRequisition(null)}>
                            <Drawer.Portal>
                                <Drawer.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
                                <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[2.5rem] mt-24 fixed bottom-0 left-0 right-0 z-[110] focus:outline-none max-h-[96vh]">
                                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 my-4" />
                                    <div className="px-6 pb-2">
                                        <Drawer.Title className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                            Detalle de Requisición
                                        </Drawer.Title>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                        <DetailContent 
                                            selectedRequisition={selectedRequisition} 
                                            statusBadges={statusBadges}
                                            userRole={userRole}
                                            handleReject={handleReject}
                                            handleApprove={handleApprove}
                                        />
                                    </div>
                                </Drawer.Content>
                            </Drawer.Portal>
                        </Drawer.Root>
                    )
                )}
            </AnimatePresence>

            <ConfirmationModal
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={handleConfirmAction}
                title={confirmAction?.type === 'approve' ? "¿Aprobar Requisición?" : "¿Rechazar Requisición?"}
                description={
                    confirmAction?.type === 'approve' 
                        ? "¿Estás seguro de que deseas aprobar esta requisición y transferir el stock? Esta acción restará el stock del almacén principal." 
                        : "¿Deseas rechazar esta requisición? El solicitante será notificado y no se moverá ningún stock."
                }
                confirmText={confirmAction?.type === 'approve' ? "Sí, Aprobar y Transferir" : "Sí, Rechazar"}
                isDestructive={confirmAction?.type === 'reject'}
                isLoading={confirmAction?.type === 'approve' ? false : actionLoading}
            />
        </div>
    );
}

// Extracted Sub-Components for the Modals

function CreateForm({
    handleCreateSubmit, destinationWarehouseId, setDestinationWarehouseId, warehouses, productSearch, setProductSearch, productResults, handleAddProduct, selectedItems, handleUpdateQty, handleRemoveItem, notes, setNotes, actionLoading
}: any) {
    return (
        <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Almacén Destino (Tu Box/Consultorio)</label>
                <select
                    value={destinationWarehouseId}
                    onChange={(e) => setDestinationWarehouseId(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-foreground"
                >
                    {warehouses.map((w: any) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Buscar Producto a Solicitar</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre (ej. Amoxicilina)..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-foreground"
                    />
                </div>
                <AnimatePresence>
                    {productResults.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute z-30 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl shadow-xl max-h-48 overflow-y-auto"
                        >
                            {productResults.map((p: any) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handleAddProduct(p)}
                                    className="w-full px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-left border-b border-slate-100 dark:border-slate-800 last:border-0 text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                    {p.name} ({p.unit})
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {selectedItems.length > 0 && (
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Productos en Solicitud</label>
                    <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-3 border border-slate-100 dark:border-slate-800 space-y-2">
                        {selectedItems.map((item: any) => (
                            <div key={item.productId} className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm gap-2">
                                <span className="font-bold text-sm text-slate-700 dark:text-slate-300 truncate flex-1">{item.name}</span>
                                <div className="flex items-center gap-2 shrink-0">
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => handleUpdateQty(item.productId, parseFloat(e.target.value))}
                                        className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold text-sm text-foreground focus:outline-none"
                                        min="1"
                                    />
                                    <span className="text-xs font-medium text-slate-400 w-10">{item.unit}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(item.productId)}
                                        className="p-1 hover:bg-red-50 text-red-500 rounded"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Notas / Observaciones</label>
                <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Indica el motivo de la reposición urgente..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 resize-none text-foreground"
                />
            </div>

            <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
                {actionLoading ? "Enviando..." : "Enviar Solicitud"}
            </button>
        </form>
    );
}

function DetailContent({ selectedRequisition, statusBadges, userRole, handleReject, handleApprove }: any) {
    return (
        <>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Solicitante</p>
                    <p className="font-bold text-slate-700 dark:text-slate-200 mt-1 flex items-center gap-1"><User size={14} /> {selectedRequisition.requester?.full_name}</p>
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destino</p>
                    <p className="font-bold text-slate-700 dark:text-slate-200 mt-1 flex items-center gap-1"><Warehouse size={14} /> {selectedRequisition.destination_warehouse?.name}</p>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold mt-1 ${statusBadges[selectedRequisition.status]?.bg} ${statusBadges[selectedRequisition.status]?.color}`}>
                        {statusBadges[selectedRequisition.status]?.label}
                    </span>
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase ml-1">Medicamentos / Insumos Solicitados</p>
                <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-3">
                    {selectedRequisition.items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                            <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{item.product?.name}</span>
                            <span className="font-black text-sm text-slate-900 dark:text-slate-100">{item.requested_quantity} <span className="text-xs font-medium text-slate-400">{item.product?.unit}</span></span>
                        </div>
                    ))}
                </div>
            </div>

            {selectedRequisition.notes && (
                <div className="space-y-1.5">
                    <p className="text-xs font-bold text-slate-500 uppercase ml-1">Observaciones</p>
                    <p className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-medium text-slate-600 dark:text-slate-350 italic">
                        "{selectedRequisition.notes}"
                    </p>
                </div>
            )}

            {userRole !== 'vet' && selectedRequisition.status === 'pending' && (
                <div className="flex gap-3 pt-4">
                    <button
                        onClick={() => handleReject(selectedRequisition.id)}
                        className="flex-1 py-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-bold transition-all border border-red-100/50 uppercase tracking-widest text-[10px]"
                    >
                        Rechazar
                    </button>
                    <button
                        onClick={() => handleApprove(selectedRequisition.id)}
                        className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 uppercase tracking-widest text-[10px]"
                    >
                        Aprobar y Transferir
                    </button>
                </div>
            )}
        </>
    );
}
