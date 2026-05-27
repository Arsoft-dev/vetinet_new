"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, AlertTriangle, Percent, Package, Warehouse, FileText } from "lucide-react";

interface WastageDashboardProps {
    stats: {
        totalLossValue: number;
        totalSurplusValue: number;
        totalDiscrepanciesCount: number;
        totalItemsAudited: number;
        breakdown: Record<string, { value: number; count: number }>;
        topProducts: Array<{ name: string; lossValue: number; unitsLost: number; unit: string }>;
        topWarehouses: Array<{ name: string; lossValue: number; surplusValue: number }>;
    };
}

const reasonLabels: Record<string, string> = {
    'counting_error': 'Error de Conteo / Rectificación',
    'clinical_omission': 'Omisión de Registro Clínico',
    'damaged_expired': 'Producto Dañado / Vencido',
    'unexplained_loss': 'Pérdida Inexplicable / Hurto',
    'unexplained_surplus': 'Sobrante Inexplicable',
    'other': 'Otros Motivos'
};

const reasonColors: Record<string, string> = {
    'counting_error': 'bg-blue-500',
    'clinical_omission': 'bg-amber-500',
    'damaged_expired': 'bg-red-500',
    'unexplained_loss': 'bg-rose-600',
    'unexplained_surplus': 'bg-emerald-500',
    'other': 'bg-slate-400'
};

export default function WastageDashboard({ stats }: WastageDashboardProps) {
    const {
        totalLossValue,
        totalSurplusValue,
        totalDiscrepanciesCount,
        totalItemsAudited,
        breakdown,
        topProducts,
        topWarehouses
    } = stats;

    // Calcular causa principal
    let mainReasonKey = "N/A";
    let maxReasonValue = 0;
    Object.entries(breakdown).forEach(([key, val]) => {
        if (key !== 'unexplained_surplus' && val.value > maxReasonValue) {
            maxReasonValue = val.value;
            mainReasonKey = key;
        }
    });

    const mainReasonLabel = reasonLabels[mainReasonKey] || "Sin Pérdidas Registradas";

    // Calcular porcentaje de discrepancia
    const discrepancyRate = totalItemsAudited > 0 
        ? ((totalDiscrepanciesCount / totalItemsAudited) * 100).toFixed(1)
        : "0.0";

    return (
        <div className="space-y-6">
            {/* Bento KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* 1. Total Pérdidas */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative overflow-hidden bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-border/40 dark:border-slate-800/80 shadow-sm group hover:border-red-500/20 transition-all flex flex-col justify-between min-h-[140px]"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors" />
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-heading">Pérdida por Mermas</span>
                        <div className="p-2.5 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 rounded-xl">
                            <TrendingDown size={18} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-black text-red-650 dark:text-red-400 font-heading">
                            ${totalLossValue.toFixed(2)}
                        </h3>
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1">Impacto financiero en productos no encontrados</p>
                    </div>
                </motion.div>

                {/* 2. Total Sobrantes */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                    className="relative overflow-hidden bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-border/40 dark:border-slate-800/80 shadow-sm group hover:border-emerald-500/20 transition-all flex flex-col justify-between min-h-[140px]"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-heading">Sobrante Conciliado</span>
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 dark:text-emerald-400 rounded-xl">
                            <TrendingUp size={18} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-black text-emerald-650 dark:text-emerald-400 font-heading">
                            ${totalSurplusValue.toFixed(2)}
                        </h3>
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1">Valor de excedentes físicos ingresados al stock</p>
                    </div>
                </motion.div>

                {/* 3. Tasa de Discrepancia */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="relative overflow-hidden bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-border/40 dark:border-slate-800/80 shadow-sm group hover:border-blue-500/20 transition-all flex flex-col justify-between min-h-[140px]"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-heading">Índice de Discrepancia</span>
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl">
                            <Percent size={18} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 font-heading">
                            {discrepancyRate}%
                        </h3>
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                            {totalDiscrepanciesCount} de {totalItemsAudited} lotes con diferencias físicas
                        </p>
                    </div>
                </motion.div>

                {/* 4. Causa Principal */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                    className="relative overflow-hidden bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-border/40 dark:border-slate-800/80 shadow-sm group hover:border-amber-500/20 transition-all flex flex-col justify-between min-h-[140px]"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-heading">Causa Raíz Crítica</span>
                        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl">
                            <AlertTriangle size={18} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 font-heading line-clamp-1">
                            {mainReasonLabel}
                        </h3>
                        {maxReasonValue > 0 ? (
                            <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400 mt-1">Acumula ${maxReasonValue.toFixed(2)} en pérdidas</p>
                        ) : (
                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1">Sin diferencias económicas negativas</p>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Segunda Fila: Distribución por causa y Top Productos */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Distribución por causa */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-border/40 dark:border-slate-800/80 shadow-sm space-y-6"
                >
                    <div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 font-heading tracking-tight flex items-center gap-2">
                            <FileText size={18} className="text-amber-500" />
                            Distribución de Pérdidas por Causa Raíz
                        </h3>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Dinero perdido desglosado por los motivos seleccionados en las auditorías.</p>
                    </div>

                    <div className="space-y-4">
                        {Object.entries(breakdown)
                            .filter(([key]) => key !== 'unexplained_surplus') // Excluimos sobrantes de la vista de pérdidas
                            .map(([key, val]) => {
                                const pct = totalLossValue > 0 ? (val.value / totalLossValue) * 100 : 0;
                                return (
                                    <div key={key} className="space-y-1.5">
                                        <div className="flex justify-between items-center text-xs font-bold">
                                            <span className="text-slate-700 dark:text-slate-350">{reasonLabels[key] || key}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400 font-medium">({val.count} casos)</span>
                                                <span className="text-slate-800 dark:text-slate-200">${val.value.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        {/* Barra de progreso */}
                                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-50 dark:border-slate-800/40">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.6, delay: 0.1 }}
                                                className={`h-full ${reasonColors[key] || 'bg-slate-500'} rounded-full`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </motion.div>

                {/* Top 5 Productos con mayor pérdida */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-border/40 dark:border-slate-800/80 shadow-sm flex flex-col justify-between"
                >
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 font-heading tracking-tight flex items-center gap-2">
                                <Package size={18} className="text-rose-500" />
                                Top Productos más Afectados
                            </h3>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Productos con el mayor impacto económico en pérdidas físicas.</p>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {topProducts.length === 0 ? (
                                <div className="text-center py-12 text-slate-450 italic text-xs font-medium">
                                    No se registran pérdidas de productos en auditorías confirmadas.
                                </div>
                            ) : (
                                topProducts.map((prod, index) => (
                                    <div key={index} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                                        <div>
                                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">{prod.name}</span>
                                            <span className="text-[10px] text-slate-400 font-medium font-mono">
                                                -{prod.unitsLost} {prod.unit}
                                            </span>
                                        </div>
                                        <span className="font-black text-xs text-red-650 dark:text-red-400 font-mono">
                                            -${prod.lossValue.toFixed(2)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Tercera Fila: Desglose por Almacén */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-border/40 dark:border-slate-800/80 shadow-sm space-y-5"
            >
                <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 font-heading tracking-tight flex items-center gap-2">
                        <Warehouse size={18} className="text-blue-500" />
                        Impacto por Almacén Físico
                    </h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Consolidado de pérdidas y sobrantes detectados por cada ubicación.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {topWarehouses.length === 0 ? (
                        <div className="col-span-full text-center py-6 text-slate-450 italic text-xs font-medium">
                            Sin datos de almacenes en auditorías confirmadas.
                        </div>
                    ) : (
                        topWarehouses.map((wh, index) => {
                            const netImpact = wh.surplusValue - wh.lossValue;
                            return (
                                <div key={index} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/40 space-y-3">
                                    <span className="font-black text-xs text-slate-800 dark:text-slate-200 block">{wh.name}</span>
                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                                        <div className="p-2 bg-red-500/5 rounded-xl border border-red-500/10">
                                            <span className="text-slate-400 block uppercase tracking-widest text-[8px]">Pérdidas</span>
                                            <span className="text-xs font-black text-red-500 font-mono">${wh.lossValue.toFixed(2)}</span>
                                        </div>
                                        <div className="p-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                                            <span className="text-slate-400 block uppercase tracking-widest text-[8px]">Sobrantes</span>
                                            <span className="text-xs font-black text-emerald-500 font-mono">${wh.surplusValue.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-bold border-t border-slate-100 dark:border-slate-800/50 pt-2.5">
                                        <span className="text-slate-400 uppercase tracking-widest text-[8px]">Impacto Neto</span>
                                        <span className={`font-mono text-xs font-black ${netImpact >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {netImpact >= 0 ? `+$${netImpact.toFixed(2)}` : `-$${Math.abs(netImpact).toFixed(2)}`}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </motion.div>
        </div>
    );
}
