"use client";

import { useState, useEffect } from "react";
import { Plus, ClipboardCheck, ArrowLeft, Calendar, User, Warehouse, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getInventoryAudits, getInventoryWastageStats } from "@/actions/inventory-audits";
import { AuditModal } from "@/components/dashboard/inventory/audits/AuditModal";
import { AuditDetailModal } from "@/components/dashboard/inventory/audits/AuditDetailModal";
import WastageDashboard from "@/components/dashboard/inventory/audits/WastageDashboard";

export default function InventoryAuditsPage() {
    const [audits, setAudits] = useState<any[]>([]);
    const [wastageStats, setWastageStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
    const router = useRouter();

    // Control de modales
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        fetchAudits();
    }, []);

    const fetchAudits = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: member } = await supabase
                .from("clinic_members")
                .select("role")
                .eq("user_id", user.id)
                .single();

            if (member && member.role === 'vet') {
                toast.error("No tienes permisos para acceder a esta sección.");
                router.push("/dashboard/inventory");
                return;
            }

            const [auditsData, statsData] = await Promise.all([
                getInventoryAudits(),
                getInventoryWastageStats()
            ]);
            setAudits(auditsData || []);
            setWastageStats(statsData);
        } catch (error) {
            console.error("Error al cargar auditorías:", error);
            toast.error("Error al obtener el listado de auditorías físicas.");
        } finally {
            setIsLoading(false);
        }
    };

    // Al iniciar una auditoría con éxito
    const handleStartSuccess = (auditId: string) => {
        fetchAudits();
        // Abrir inmediatamente el modal de detalle del conteo sobre la auditoría creada
        setSelectedAuditId(auditId);
    };

    const statusLabels: Record<string, { label: string, color: string, bg: string }> = {
        'draft': { label: 'Borrador', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100/60 dark:bg-amber-950/20' },
        'confirmed': { label: 'Confirmada', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100/60 dark:bg-emerald-950/20' },
        'canceled': { label: 'Cancelada', color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' }
    };

    return (
        <div className="space-y-8">
            {/* Cabecera */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black font-heading text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl text-amber-600 dark:text-amber-400">
                            <ClipboardCheck size={32} />
                        </div>
                        Control de Stock y Tomas Físicas
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Realiza auditorías de inventario y analiza las mermas de la clínica.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    {/* Selector de Pestañas Bento-Style */}
                    <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-[22px] border border-border/40 w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab('list')}
                            className={`flex items-center justify-center gap-2 px-4 py-2 hover:bg-white dark:hover:bg-slate-900 rounded-[18px] font-bold text-xs transition-all w-full sm:w-auto ${
                                activeTab === 'list' 
                                    ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm' 
                                    : 'text-slate-500 dark:text-slate-400'
                            }`}
                        >
                            <ClipboardCheck size={16} />
                            Tomas Físicas
                        </button>
                        <button
                            onClick={() => setActiveTab('stats')}
                            className={`flex items-center justify-center gap-2 px-4 py-2 hover:bg-white dark:hover:bg-slate-900 rounded-[18px] font-bold text-xs transition-all w-full sm:w-auto ${
                                activeTab === 'stats' 
                                    ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm' 
                                    : 'text-slate-500 dark:text-slate-400'
                            }`}
                        >
                            <BarChart3 size={16} />
                            Estadísticas de Mermas
                        </button>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <Link href="/dashboard/inventory" className="flex-1 sm:flex-none">
                            <button className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm text-xs">
                                <ArrowLeft size={16} />
                                Volver
                            </button>
                        </Link>
                        <button 
                            onClick={() => setIsCreateOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-500/20 text-xs uppercase tracking-wider"
                        >
                            <Plus size={16} />
                            Nueva Auditoría
                        </button>
                    </div>
                </div>
            </div>

            {/* Renderizado de Pestañas con Transición */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
            >
                {activeTab === 'list' ? (
                    // Listado de Auditorías
                    isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />)}
                        </div>
                    ) : audits.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800/40">
                            <ClipboardCheck size={64} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Sin auditorías registradas</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mt-2 text-sm">Inicia una toma física para comparar lo que dice el sistema con lo que hay en el estante y conciliar el stock.</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-border/40 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-border/40">
                                        <tr>
                                            <th className="px-8 py-5">Fecha y Estado</th>
                                            <th className="px-8 py-5">Almacén</th>
                                            <th className="px-8 py-5">Items</th>
                                            <th className="px-8 py-5">Responsable</th>
                                            <th className="px-8 py-5 text-right w-32">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                                        {audits.map((audit) => {
                                            const state = statusLabels[audit.status] || { label: audit.status, color: 'text-slate-500', bg: 'bg-slate-100' };
                                            return (
                                                <tr key={audit.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                                                                <Calendar size={14} className="text-slate-450" />
                                                                {format(new Date(audit.created_at), "dd MMMM, yyyy", { locale: es })}
                                                            </div>
                                                            <span className={`text-[9px] font-black uppercase w-fit px-2 py-0.5 rounded mt-1.5 ${state.bg} ${state.color}`}>
                                                                {state.label}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-black">
                                                            <Warehouse size={16} className="text-slate-400" />
                                                            {audit.warehouse?.name || "General"}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-slate-500 font-mono text-xs dark:text-slate-400">
                                                        {audit.items_count} lotes audita.
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                                                            <User size={16} className="text-slate-400" />
                                                            {audit.user?.full_name || "Sistema"}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <button 
                                                            onClick={() => setSelectedAuditId(audit.id)}
                                                            className="px-4 py-2 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all"
                                                        >
                                                            {audit.status === 'draft' ? 'Registrar' : 'Detalles'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                ) : (
                    // Estadísticas de Mermas
                    isLoading ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />)}
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
                                <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
                            </div>
                        </div>
                    ) : wastageStats ? (
                        <WastageDashboard stats={wastageStats} />
                    ) : (
                        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800/40">
                            <BarChart3 size={64} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Sin estadísticas de mermas</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mt-2 text-sm">Las estadísticas de mermas se calculan en base a las auditorías físicas confirmadas.</p>
                        </div>
                    )
                )}
            </motion.div>

            {/* Modal para Iniciar Auditoría */}
            <AuditModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onStartSuccess={handleStartSuccess}
            />

            {/* Modal de Detalle y Conteo de Auditoría */}
            {selectedAuditId && (
                <AuditDetailModal
                    isOpen={!!selectedAuditId}
                    onClose={() => {
                        setSelectedAuditId(null);
                        fetchAudits();
                    }}
                    auditId={selectedAuditId}
                    onSaveSuccess={fetchAudits}
                />
            )}
        </div>
    );
}

