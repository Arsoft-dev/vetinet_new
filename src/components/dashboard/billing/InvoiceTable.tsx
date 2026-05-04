"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Receipt, ChevronLeft, ChevronRight, Eye, Calendar, User, Banknote } from "lucide-react";
import Link from "next/link";

export function InvoiceTable({ initialInvoices }: { initialInvoices: any[] }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Dynamic items per page based on screen size
    useEffect(() => {
        const updateItemsPerPage = () => {
            if (window.innerWidth < 1024) {
                setItemsPerPage(5);
            } else {
                setItemsPerPage(10);
            }
        };

        updateItemsPerPage();
        window.addEventListener('resize', updateItemsPerPage);
        return () => window.removeEventListener('resize', updateItemsPerPage);
    }, []);

    const totalPages = Math.ceil(initialInvoices.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedInvoices = initialInvoices.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-border/10 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/30">
                <div>
                    <h2 className="font-black text-xl text-slate-800 dark:text-slate-100 tracking-tight">Historial de Facturación</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Mostrando {paginatedInvoices.length} de {initialInvoices.length} registros</p>
                </div>
            </div>

            {/* Mobile View (Cards) */}
            <div className="block lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedInvoices.map((inv) => (
                    <div key={inv.id} className="p-6 space-y-4 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-xs font-black font-mono text-primary">#{String(inv.invoice_number).padStart(6, '0')}</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">{inv.client_name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{inv.client_id_number}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                inv.status === 'paid' || inv.status === 'issued' 
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' 
                                    : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800'
                            }`}>
                                {inv.status === 'paid' || inv.status === 'issued' ? 'Completada' : 'Anulada'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800">
                            <div className="space-y-1">
                                <p className="text-[9px] text-slate-400 uppercase font-black flex items-center gap-1">
                                    <Calendar size={10} /> {format(new Date(inv.created_at), "dd/MM/yyyy HH:mm")}
                                </p>
                                <div className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-baseline gap-1">
                                    <span className="text-[10px] font-bold text-slate-400">Bs</span>
                                    {inv.total_amount.toFixed(2)}
                                </div>
                                <p className="text-[10px] text-emerald-500 font-bold">Ref: ${inv.total_amount_usd ? inv.total_amount_usd.toFixed(2) : (inv.total_amount / (inv.exchange_rate || 1)).toFixed(2)}</p>
                            </div>
                            <Link href={`/dashboard/print/invoice/${inv.id}`} target="_blank">
                                <button className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl active:scale-95 transition-all shadow-sm">
                                    <Receipt size={24} />
                                </button>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                        <tr>
                            <th className="px-8 py-5">Nro. Factura</th>
                            <th className="px-8 py-5">Fecha y Hora</th>
                            <th className="px-8 py-5">Cliente / Documento</th>
                            <th className="px-8 py-5 text-center">Estatus</th>
                            <th className="px-8 py-5 text-right">Monto Total</th>
                            <th className="px-8 py-5 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {paginatedInvoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                <td className="px-8 py-5 font-black font-mono text-slate-700 dark:text-slate-300">
                                    #{String(inv.invoice_number).padStart(6, '0')}
                                </td>
                                <td className="px-8 py-5 text-slate-500 dark:text-slate-400 font-medium">
                                    {format(new Date(inv.created_at), "dd MMM, yyyy · HH:mm", { locale: es })}
                                </td>
                                <td className="px-8 py-5">
                                    <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight">{inv.client_name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono tracking-tighter">{inv.client_id_number}</p>
                                </td>
                                <td className="px-8 py-5 text-center">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                        inv.status === 'paid' || inv.status === 'issued' 
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' 
                                            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800'
                                    }`}>
                                        {inv.status === 'paid' || inv.status === 'issued' ? 'Completada' : 'Anulada'}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <p className="font-black text-slate-900 dark:text-slate-100 text-base">Bs {inv.total_amount.toFixed(2)}</p>
                                    <p className="text-[10px] text-emerald-500 font-bold">Ref: ${inv.total_amount_usd ? inv.total_amount_usd.toFixed(2) : (inv.total_amount / (inv.exchange_rate || 1)).toFixed(2)}</p>
                                </td>
                                <td className="px-8 py-5 text-center">
                                    <Link href={`/dashboard/print/invoice/${inv.id}`} target="_blank">
                                        <button className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white rounded-xl transition-all text-slate-500 dark:text-slate-400 shadow-sm group-hover:scale-110" title="Ver Factura">
                                            <Receipt size={18} />
                                        </button>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 disabled:opacity-30 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        
                        <div className="flex items-center gap-1.5">
                            {/* Simple dynamic window logic */}
                            {Array.from({ length: totalPages }).map((_, i) => {
                                const pageNum = i + 1;
                                // Only show current, first, last, and neighbors if many pages
                                const isNear = Math.abs(currentPage - pageNum) <= 1;
                                const isEdge = pageNum === 1 || pageNum === totalPages;
                                
                                if (!isNear && !isEdge && totalPages > 5) {
                                    if (pageNum === 2 || pageNum === totalPages - 1) return <span key={pageNum} className="text-slate-300 text-[10px]">...</span>;
                                    return null;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`min-w-[36px] h-9 rounded-xl text-[11px] font-black transition-all ${
                                            currentPage === pageNum 
                                                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                                                : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 disabled:opacity-30 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Página {currentPage} de {totalPages}
                    </p>
                </div>
            </div>
        </div>
    );
}
