"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Layers, Edit, Trash2, ArrowLeft, ArrowRight, Warehouse } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Drawer } from "vaul";
import { useMediaQuery } from "@/hooks/use-media-query";
import { getProductKits, deleteProductKit, useProductKitDirectly } from "@/actions/product-kits";
import { ProductKitModal } from "@/components/dashboard/inventory/kits/ProductKitModal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

export default function ProductKitsPage() {
    const [kits, setKits] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const supabase = createClient();
    // Detectar si es escritorio para alternar entre modal y drawer
    const isDesktop = useMediaQuery("(min-width: 768px)");

    // Catálogo de almacenes para el consumo de kit
    const [warehouses, setWarehouses] = useState<any[]>([]);

    // Control de modales
    const [isKitModalOpen, setIsKitModalOpen] = useState(false);
    const [selectedKit, setSelectedKit] = useState<any>(null);
    const [kitToDelete, setKitToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Control del modal de "Usar Kit" (selección de almacén)
    const [kitToUse, setKitToUse] = useState<any>(null);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
    const [isConsuming, setIsConsuming] = useState(false);

    useEffect(() => {
        fetchKits();
        fetchWarehouses();
    }, []);

    const fetchKits = async () => {
        setIsLoading(true);
        try {
            const data = await getProductKits();
            setKits(data || []);
        } catch (error) {
            console.error("Error al cargar los kits:", error);
            toast.error("Error al cargar el listado de kits.");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchWarehouses = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: member } = await supabase
            .from("clinic_members")
            .select("clinic_id")
            .eq("user_id", user.id)
            .single();

        if (member) {
            const { data } = await supabase
                .from("warehouses")
                .select("id, name")
                .eq("clinic_id", member.clinic_id)
                .eq("is_active", true)
                .order("name");
            setWarehouses(data || []);
        }
    };

    // Confirmar y procesar eliminación de kit
    const handleDeleteConfirm = async () => {
        if (!kitToDelete) return;
        setIsDeleting(true);
        try {
            const res = await deleteProductKit(kitToDelete.id);
            if (res.success) {
                toast.success(res.message);
                fetchKits();
                setKitToDelete(null);
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            console.error("Error al eliminar kit:", error);
            toast.error("Ocurrió un error inesperado al intentar eliminar el kit.");
        } finally {
            setIsDeleting(false);
        }
    };

    // Confirmar y procesar el consumo de stock del kit
    const handleConsumeConfirm = async () => {
        if (!kitToUse) return;
        if (!selectedWarehouseId) {
            toast.error("Debes seleccionar un almacén para descontar stock.");
            return;
        }

        setIsConsuming(true);
        try {
            const res = await useProductKitDirectly(kitToUse.id, selectedWarehouseId);
            if (res.success) {
                toast.success(res.message);
                setKitToUse(null);
                setSelectedWarehouseId("");
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            console.error("Error al consumir kit:", error);
            toast.error("Ocurrió un error inesperado al descontar el kit.");
        } finally {
            setIsConsuming(false);
        }
    };

    // Filtrado de kits por búsqueda
    const filteredKits = kits.filter(kit =>
        kit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (kit.description && kit.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-8">
            {/* Cabecera */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black font-heading text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl text-purple-600 dark:text-purple-400">
                            <Layers size={32} />
                        </div>
                        Kits y Recetas de Consumo
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Crea combos de productos para agilizar el consumo en consultas.</p>
                </div>

                <div className="flex gap-3">
                    <Link href="/dashboard/inventory">
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
                            <ArrowLeft size={20} />
                            Volver
                        </button>
                    </Link>
                    <button 
                        onClick={() => {
                            setSelectedKit(null);
                            setIsKitModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20"
                    >
                        <Plus size={20} />
                        Nuevo Kit
                    </button>
                </div>
            </div>

            {/* Barra de Búsqueda */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar kit por nombre o descripción..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none font-bold text-sm text-slate-800 dark:text-slate-100 transition-all shadow-sm"
                />
            </div>

            {/* Listado de Kits */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map(i => <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-[40px] animate-pulse" />)}
                </div>
            ) : filteredKits.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800/40">
                    <Layers size={64} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        {searchQuery ? "No se encontraron coincidencias" : "No hay kits configurados"}
                    </h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">
                        {searchQuery 
                            ? "Intenta buscar con otros términos o crea un kit nuevo." 
                            : "Los kits permiten agrupar varios productos (ej: 'Kit de Cirugía') para descontar su stock de forma rápida y consolidada."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredKits.map((kit) => (
                        <motion.div
                            key={kit.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-border/40 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-850 dark:text-slate-100 leading-tight">{kit.name}</h3>
                                        <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">{kit.description || "Sin descripción descriptiva."}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-4">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Precio Kit</p>
                                        <p className="text-lg font-black text-purple-600 dark:text-purple-400">${Number(kit.sale_price).toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="space-y-2 bg-slate-50/60 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/40">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5">Componentes del Combo</p>
                                    {kit.items?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-purple-400 dark:bg-purple-500 rounded-full" />
                                                <span className="font-bold text-slate-700 dark:text-slate-200">{item.product?.name}</span>
                                            </div>
                                            <span className="font-mono font-medium text-slate-550 dark:text-slate-400">{item.quantity} {item.product?.unit || 'und'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 pt-5 border-t border-slate-50 dark:border-slate-800/60 flex justify-between items-center">
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => {
                                            setSelectedKit(kit);
                                            setIsKitModalOpen(true);
                                        }}
                                        className="p-2 text-slate-450 hover:text-blue-650 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all" 
                                        title="Editar"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button 
                                        onClick={() => setKitToDelete(kit)}
                                        className="p-2 text-slate-450 hover:text-red-650 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all" 
                                        title="Eliminar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <button 
                                    onClick={() => {
                                        setKitToUse(kit);
                                        setSelectedWarehouseId(""); // resetear selección
                                    }}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-102 active:scale-98 transition-all shadow-sm"
                                >
                                    Usar Kit <ArrowRight size={12} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal CRUD Kits */}
            <ProductKitModal
                isOpen={isKitModalOpen}
                onClose={() => {
                    setIsKitModalOpen(false);
                    setSelectedKit(null);
                }}
                kit={selectedKit}
                onSaveSuccess={fetchKits}
            />

            {/* Modal de Confirmación de Borrado de Kit — usa ConfirmationModal que ya maneja Drawer internamente */}
            <ConfirmationModal
                isOpen={!!kitToDelete}
                onClose={() => setKitToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title="¿Eliminar Kit de Productos?"
                description={`Estás a punto de eliminar el kit "${kitToDelete?.name ?? ''}". Esta acción borrará la plantilla del combo de forma permanente, pero no afectará el stock actual de sus productos.`}
                confirmText={isDeleting ? "Eliminando..." : "Confirmar Eliminación"}
                cancelText="Cancelar"
                isDestructive
                isLoading={isDeleting}
            />

            {/* Modal de Selección de Almacén para "Usar Kit" — responsivo con Drawer en móvil */}
            <AnimatePresence>
                {kitToUse && (
                    isDesktop ? (
                        // Versión escritorio: modal centrado con backdrop
                        <div key="use-kit-backdrop" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => {
                                    setKitToUse(null);
                                    setSelectedWarehouseId("");
                                }}
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-border/40 dark:border-slate-800 shadow-2xl"
                            >
                                {/* Contenido compartido del modal de consumo de kit */}
                                <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400 mb-4">
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl">
                                        <Warehouse size={24} />
                                    </div>
                                    <h3 className="text-lg font-black tracking-tight">Consumir Kit de Stock</h3>
                                </div>

                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                                    Selecciona el almacén desde el cual se descontarán físicamente los componentes del kit <strong className="text-slate-800 dark:text-slate-200">"{kitToUse.name}"</strong>:
                                </p>

                                <div className="space-y-3">
                                    <select
                                        value={selectedWarehouseId}
                                        onChange={(e) => setSelectedWarehouseId(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none font-bold text-xs text-slate-800 dark:text-slate-100 transition-all cursor-pointer"
                                    >
                                        <option value="">Selecciona almacén...</option>
                                        {warehouses.map(wh => (
                                            <option key={wh.id} value={wh.id}>{wh.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => {
                                            setKitToUse(null);
                                            setSelectedWarehouseId("");
                                        }}
                                        disabled={isConsuming}
                                        className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleConsumeConfirm}
                                        disabled={isConsuming || !selectedWarehouseId}
                                        className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-750 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                                    >
                                        {isConsuming ? "Procesando..." : "Confirmar Consumo"}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    ) : (
                        // Versión móvil: drawer (bottom sheet) deslizable
                        <Drawer.Root
                            open={!!kitToUse}
                            onOpenChange={(open) => {
                                if (!open) {
                                    setKitToUse(null);
                                    setSelectedWarehouseId("");
                                }
                            }}
                        >
                            <Drawer.Portal>
                                <Drawer.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
                                <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[2.5rem] mt-24 fixed bottom-0 left-0 right-0 z-[110] focus:outline-none max-h-[96vh]">
                                    {/* Barra de arrastre del drawer */}
                                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 my-4" />
                                    <div className="px-6 pb-2">
                                        <Drawer.Title className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                            Consumir Kit de Stock
                                        </Drawer.Title>
                                    </div>
                                    <div className="flex-1 overflow-y-auto pb-8 px-6">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                                            Selecciona el almacén desde el cual se descontarán físicamente los componentes del kit <strong className="text-slate-800 dark:text-slate-200">"{kitToUse.name}"</strong>:
                                        </p>

                                        <div className="space-y-3">
                                            <select
                                                value={selectedWarehouseId}
                                                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none font-bold text-xs text-slate-800 dark:text-slate-100 transition-all cursor-pointer"
                                            >
                                                <option value="">Selecciona almacén...</option>
                                                {warehouses.map(wh => (
                                                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex gap-3 mt-6">
                                            <button
                                                onClick={() => {
                                                    setKitToUse(null);
                                                    setSelectedWarehouseId("");
                                                }}
                                                disabled={isConsuming}
                                                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleConsumeConfirm}
                                                disabled={isConsuming || !selectedWarehouseId}
                                                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-750 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                                            >
                                                {isConsuming ? "Procesando..." : "Confirmar Consumo"}
                                            </button>
                                        </div>
                                    </div>
                                </Drawer.Content>
                            </Drawer.Portal>
                        </Drawer.Root>
                    )
                )}
            </AnimatePresence>
        </div>
    );
}
