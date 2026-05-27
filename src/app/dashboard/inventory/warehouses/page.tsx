"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Warehouse, ArrowRightLeft, Edit, Trash2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { WarehouseModal } from "@/components/dashboard/inventory/warehouses/WarehouseModal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { deleteWarehouse } from "@/actions/warehouses";

export default function WarehousesPage() {
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();
    
    // Estados para control de modales
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
    const [warehouseToDelete, setWarehouseToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        fetchWarehouses();
    }, []);

    const fetchWarehouses = async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: member } = await supabase
            .from("clinic_members")
            .select("clinic_id, role")
            .eq("user_id", user.id)
            .single();

        if (member) {
            if (member.role === 'vet') {
                toast.error("No tienes permisos para acceder a esta sección.");
                router.push("/dashboard/inventory");
                return;
            }

            const { data } = await supabase
                .from("warehouses")
                .select("*")
                .eq("clinic_id", member.clinic_id)
                .order("name");
            setWarehouses(data || []);
        }
        setIsLoading(false);
    };

    // Confirmar y procesar eliminación de almacén
    const handleDeleteConfirm = async () => {
        if (!warehouseToDelete) return;
        setIsDeleting(true);
        try {
            const res = await deleteWarehouse(warehouseToDelete.id);
            if (res.success) {
                toast.success(res.message);
                fetchWarehouses();
                setWarehouseToDelete(null);
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            console.error("Error al eliminar almacén:", error);
            toast.error("Ocurrió un error inesperado al intentar eliminar el almacén.");
        } finally {
            setIsDeleting(false);
        }
    };

    const typeLabels: Record<string, string> = {
        'storage': 'Depósito / Bodega',
        'point_of_sale': 'Punto de Venta / Farmacia',
        'consulting': 'Consultorio / Clínico',
        'quarantine': 'Cuarentena / Bloqueado'
    };

    // Filtrado de almacenes por búsqueda
    const filteredWarehouses = warehouses.filter(wh =>
        wh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (wh.description && wh.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (typeLabels[wh.type] && typeLabels[wh.type].toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-8">
            {/* Cabecera de Página */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black font-heading text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl text-emerald-600 dark:text-emerald-400">
                            <Warehouse size={32} />
                        </div>
                        Gestión de Almacenes
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Organiza tu stock por ubicaciones físicas.</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Link href="/dashboard/inventory">
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
                            <ArrowLeft size={20} />
                            Volver
                        </button>
                    </Link>
                    <Link href="/dashboard/inventory/warehouses/transfers">
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20">
                            <ArrowRightLeft size={20} />
                            Transferencias Internas
                        </button>
                    </Link>
                    <button 
                        onClick={() => {
                            setSelectedWarehouse(null);
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                    >
                        <Plus size={20} />
                        Nuevo Almacén
                    </button>
                </div>
            </div>

            {/* Barra de Búsqueda */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar almacén por nombre o tipo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-bold text-sm text-slate-800 dark:text-slate-100 transition-all shadow-sm"
                />
            </div>

            {/* Grid de Almacenes */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-44 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />)}
                </div>
            ) : filteredWarehouses.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800/40">
                    <Warehouse size={64} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        {searchQuery ? "No se encontraron coincidencias" : "Sin almacenes registrados"}
                    </h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">
                        {searchQuery 
                            ? "Intenta con otro término de búsqueda o crea un nuevo almacén." 
                            : "Crea múltiples ubicaciones para rastrear el stock en farmacia, consultorios y bodega de almacenamiento."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredWarehouses.map((wh) => (
                        <motion.div
                            key={wh.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-border/40 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-2xl ${
                                        wh.type === 'storage' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                                        wh.type === 'point_of_sale' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                                        wh.type === 'consulting' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' :
                                        'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                                    }`}>
                                        <Warehouse size={24} />
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${wh.is_active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                        {wh.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>

                                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight mb-1">{wh.name}</h3>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{typeLabels[wh.type] || wh.type}</p>
                                
                                {wh.description && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 line-clamp-2">{wh.description}</p>
                                )}
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                                <Link 
                                    href={`/dashboard/inventory/movements?warehouseId=${wh.id}`} 
                                    className="text-xs font-bold text-blue-600 hover:text-blue-750 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1.5"
                                >
                                    <ArrowRightLeft size={14} /> Historial Kardex
                                </Link>
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => {
                                            setSelectedWarehouse(wh);
                                            setIsModalOpen(true);
                                        }}
                                        className="p-2 text-slate-450 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button 
                                        onClick={() => setWarehouseToDelete(wh)}
                                        className="p-2 text-slate-455 hover:text-red-650 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal CRUD Almacenes */}
            <WarehouseModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedWarehouse(null);
                }}
                warehouse={selectedWarehouse}
                onSaveSuccess={fetchWarehouses}
            />

            {/* Modal de confirmación de borrado — usa ConfirmationModal que ya maneja Drawer en móvil */}
            <ConfirmationModal
                isOpen={!!warehouseToDelete}
                onClose={() => setWarehouseToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title="¿Eliminar Almacén?"
                description={`Estás a punto de eliminar el almacén "${warehouseToDelete?.name}". Esta acción no se puede deshacer y fallará si existen lotes con stock asociado en esta ubicación.`}
                confirmText="Confirmar Eliminación"
                cancelText="Cancelar"
                isDestructive={true}
                isLoading={isDeleting}
            />
        </div>
    );
}
