"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Building2, Phone, Mail, MapPin, Edit, Trash2, ArrowLeft, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SupplierModal } from "@/components/dashboard/inventory/suppliers/SupplierModal";
import { deleteSupplier } from "@/actions/suppliers";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    
    // Estados para el Modal de CRUD
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);

    // Estado para el modal de confirmación de eliminación
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        setIsLoading(true);
        try {
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

                const { data, error } = await supabase
                    .from("suppliers")
                    .select("*")
                    .eq("clinic_id", member.clinic_id)
                    .order("name");
                
                if (error) throw error;
                setSuppliers(data || []);
            }
        } catch (error: any) {
            console.error("Error al cargar proveedores:", error);
            toast.error("No se pudieron cargar los proveedores.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (supplier: any) => {
        setSelectedSupplier(supplier);
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setSelectedSupplier(null);
        setIsModalOpen(true);
    };

    // Abre el modal de confirmación para eliminar un proveedor
    const handleDelete = (id: string) => {
        setDeleteConfirmId(id);
    };

    // Ejecuta la eliminación del proveedor tras confirmar en el modal
    const executeDelete = async () => {
        if (!deleteConfirmId) return;
        setIsDeleting(true);
        const toastId = toast.loading("Eliminando proveedor...");
        try {
            const res = await deleteSupplier(deleteConfirmId);
            if (res.success) {
                toast.success(res.message, { id: toastId });
                // Actualizar la lista local
                setSuppliers(prev => prev.filter(s => s.id !== deleteConfirmId));
            } else {
                toast.error(res.message, { id: toastId });
            }
        } catch (error) {
            console.error("Error deleting supplier:", error);
            toast.error("Error al intentar eliminar el proveedor.", { id: toastId });
        } finally {
            setIsDeleting(false);
            setDeleteConfirmId(null);
        }
    };

    const filteredSuppliers = suppliers.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.tax_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black font-heading text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400">
                            <Building2 size={32} />
                        </div>
                        Directorio de Proveedores
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Gestiona tus contactos comerciales y compras.</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Link href="/dashboard/inventory">
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
                            <ArrowLeft size={20} />
                            Volver
                        </button>
                    </Link>
                    
                    {/* Botón de Órdenes de Compra */}
                    <Link href="/dashboard/inventory/suppliers/purchase-orders">
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-all shadow-sm">
                            <ClipboardList size={20} />
                            Órdenes de Compra
                        </button>
                    </Link>

                    <button 
                        onClick={handleNew}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                        <Plus size={20} />
                        Nuevo Proveedor
                    </button>
                </div>
            </div>

            <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por nombre, contacto o RIF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-medium shadow-sm transition-all text-slate-800 dark:text-slate-100"
                />
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />)}
                </div>
            ) : filteredSuppliers.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <Building2 size={64} className="mx-auto text-slate-200 mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">No hay proveedores registrados</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">Agrega tus proveedores para empezar a gestionar órdenes de compra profesionales.</p>
                    <button 
                        onClick={handleNew}
                        className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 inline-flex items-center gap-2"
                    >
                        <Plus size={18} /> Registrar Primer Proveedor
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSuppliers.map((supplier) => (
                        <motion.div
                            key={supplier.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-border/40 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between min-h-[220px]"
                        >
                            <div>
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 font-black text-xl">
                                        {supplier.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight truncate" title={supplier.name}>{supplier.name}</h3>
                                        <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mt-1">{supplier.tax_id || "Sin RIF/ID"}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                        <Phone size={16} className="text-slate-400 shrink-0" />
                                        <span className="font-medium truncate">{supplier.phone || "Sin teléfono"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                        <Mail size={16} className="text-slate-400 shrink-0" />
                                        <span className="font-medium truncate" title={supplier.email}>{supplier.email || "Sin email"}</span>
                                    </div>
                                    <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                                        <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
                                        <span className="font-medium line-clamp-2" title={supplier.address}>{supplier.address || "Sin dirección registrada"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center bg-transparent">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[150px]">
                                    Encargado: <span className="text-slate-600 dark:text-slate-300 ml-1 font-bold">{supplier.contact_person || "-"}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleEdit(supplier)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                                        title="Editar"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(supplier.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal de CRUD */}
            <SupplierModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                supplier={selectedSupplier}
                onSaveSuccess={fetchSuppliers}
            />

            {/* Modal de confirmación para eliminar proveedor */}
            <ConfirmationModal
                isOpen={deleteConfirmId !== null}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={executeDelete}
                title="Eliminar Proveedor"
                description={`¿Estás seguro de que deseas eliminar al proveedor "${suppliers.find(s => s.id === deleteConfirmId)?.name || ''}"? Esta acción no se puede deshacer.`}
                confirmText="Sí, Eliminar"
                isDestructive
                isLoading={isDeleting}
            />
        </div>
    );
}
