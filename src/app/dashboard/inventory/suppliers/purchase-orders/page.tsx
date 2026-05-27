"use client";

import { useState, useEffect } from "react";
import { Plus, Search, ClipboardList, Building2, Map, DollarSign, Calendar, User, ArrowLeft, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { getPurchaseOrders } from "@/actions/purchase-orders";
import { PurchaseOrderModal } from "@/components/dashboard/inventory/suppliers/PurchaseOrderModal";
import { OrderDetailModal } from "@/components/dashboard/inventory/suppliers/OrderDetailModal";

export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setIsLoading(true);
        try {
            const data = await getPurchaseOrders();
            setOrders(data || []);
        } catch (error) {
            console.error("Error loading purchase orders:", error);
            toast.error("No se pudieron cargar las órdenes de compra.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenDetail = (id: string) => {
        setSelectedOrderId(id);
    };

    const handleCloseDetail = () => {
        setSelectedOrderId(null);
    };

    const filteredOrders = orders.filter(o => 
        o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Mapeo estético de estados
    const statusBadges: Record<string, { label: string; bg: string; text: string }> = {
        'pending': { label: 'Borrador', bg: 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700', text: 'text-slate-650 dark:text-slate-350' },
        'ordered': { label: 'Ordenada', bg: 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
        'received': { label: 'Recibida', bg: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-450' },
        'canceled': { label: 'Cancelada', bg: 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20', text: 'text-red-650 dark:text-red-400' }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black font-heading text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl text-emerald-600 dark:text-emerald-400">
                            <ClipboardList size={32} />
                        </div>
                        Órdenes de Compra
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Historial de órdenes a proveedores y entrada de stock.</p>
                </div>

                <div className="flex gap-3">
                    <Link href="/dashboard/inventory/suppliers">
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
                            <ArrowLeft size={20} />
                            Volver a Proveedores
                        </button>
                    </Link>

                    <button 
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-750 transition-all shadow-lg shadow-emerald-600/20"
                    >
                        <Plus size={20} />
                        Nueva Orden
                    </button>
                </div>
            </div>

            {/* Búsqueda */}
            <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por Nº de orden, proveedor o nota..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-medium shadow-sm transition-all text-slate-800 dark:text-slate-100"
                />
            </div>

            {/* Listado */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <ClipboardList size={64} className="mx-auto text-slate-200 mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">No hay órdenes de compra registradas</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">Crea órdenes de compra detalladas para organizar tus suministros médicos e ingresos al almacén.</p>
                    <button 
                        onClick={() => setIsCreateOpen(true)}
                        className="mt-6 px-5 py-2.5 bg-emerald-650 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 inline-flex items-center gap-2"
                    >
                        <Plus size={18} /> Crear Primera Orden
                    </button>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-border/40 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-400 font-bold uppercase tracking-widest text-[9px] border-b border-slate-100 dark:border-slate-800">
                                    <th className="p-4">Nº Orden</th>
                                    <th className="p-4">Proveedor</th>
                                    <th className="p-4">Almacén Destino</th>
                                    <th className="p-4">Fecha Creada</th>
                                    <th className="p-4 text-right">Monto Total</th>
                                    <th className="p-4 text-center">Estado</th>
                                    <th className="p-4 text-center w-24">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredOrders.map((order) => {
                                    const badge = statusBadges[order.status] || { label: order.status, bg: 'bg-slate-100', text: 'text-slate-650' };
                                    return (
                                        <tr 
                                            key={order.id} 
                                            className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
                                            onClick={() => handleOpenDetail(order.id)}
                                        >
                                            <td className="p-4 font-black text-blue-500 font-mono text-sm">{order.order_number}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Building2 size={14} className="text-slate-400" />
                                                    <span className="font-bold">{order.supplier?.name || "Sin proveedor"}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Map size={14} className="text-slate-400" />
                                                    <span>{order.warehouse?.name || "Sin almacén"}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                    <Calendar size={14} />
                                                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right font-bold text-slate-800 dark:text-slate-100 text-sm">
                                                ${Number(order.total_amount_usd).toFixed(2)}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-block px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${badge.bg} ${badge.text}`}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                <button 
                                                    onClick={() => handleOpenDetail(order.id)}
                                                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-650 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl transition-all font-bold"
                                                >
                                                    Ver <ArrowUpRight size={14} />
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

            {/* Modales */}
            <PurchaseOrderModal 
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSaveSuccess={loadOrders}
            />

            <OrderDetailModal 
                isOpen={selectedOrderId !== null}
                onClose={handleCloseDetail}
                orderId={selectedOrderId}
                onStatusChangeSuccess={loadOrders}
            />
        </div>
    );
}
