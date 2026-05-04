"use client";

import { ArrowDown, ArrowUp, RefreshCw, Filter, FileSpreadsheet, Printer, X } from "lucide-react";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { useState, useEffect } from "react";

interface Movement {
    id: string;
    type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
    quantity_change: number;
    stock_before?: number;
    stock_after?: number;
    reason: string;
    created_at: string;
    product: {
        name: string;
        category: string;
        unit: string;
    } | null;
    user: {
        full_name: string;
    } | null;
}

export function MovementsTable({ movements }: { movements: Movement[] }) {

    const getTypeConfig = (type: string) => {
        const normalizedType = type.toUpperCase();
        switch (normalizedType) {
            case 'COMPRA':
            case 'IN':
                return { color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400', icon: <ArrowDown size={14} />, label: "Compra/Entrada" };
            case 'VENTA':
            case 'OUT':
                return { color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400', icon: <ArrowUp size={14} />, label: "Venta/Salida" };
            case 'AJUSTE':
            case 'ADJUSTMENT':
                return { color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400', icon: <RefreshCw size={14} />, label: "Ajuste" };
            case 'DEVOLUCIÓN':
            case 'RETURN':
                return { color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400', icon: <ArrowDown size={14} />, label: "Devolución" };
            case 'EXPIRADO':
            case 'EXPIRATION':
                return { color: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400', icon: <X size={14} />, label: "Expirado" };
            default:
                return { color: 'text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-400', icon: <Filter size={14} />, label: type };
        }
    };

    // Filters
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const filteredMovements = movements.filter(m => {
        if (!startDate && !endDate) return true;
        const date = new Date(m.created_at);
        if (startDate && isBefore(date, startOfDay(new Date(startDate)))) return false;
        if (endDate && isAfter(date, endOfDay(new Date(endDate)))) return false;
        return true;
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Adjust items per page based on screen size (5 for mobile, 10 for desktop)
    useEffect(() => {
        const handleResize = () => setItemsPerPage(window.innerWidth < 768 ? 5 : 10);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [startDate, endDate]);

    const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
    const currentMovements = filteredMovements.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const exportToExcel = () => {
        let tableHtml = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="utf-8" />
                <style>
                    table { border-collapse: collapse; width: 100%; font-family: sans-serif; }
                    th { background-color: #3b82f6; color: white; font-weight: bold; padding: 10px; border: 1px solid #e2e8f0; text-align: left; }
                    td { padding: 10px; border: 1px solid #e2e8f0; }
                    .row-even { background-color: #f8fafc; }
                    .row-odd { background-color: #ffffff; }
                    .font-bold { font-weight: bold; }
                    .text-right { text-align: right; }
                    .text-green { color: #16a34a; font-weight: bold; }
                    .text-red { color: #dc2626; font-weight: bold; }
                </style>
            </head>
            <body>
                <h2>Auditoría de Inventario - Vetinet</h2>
                ${startDate || endDate ? `<p>Filtrado desde: ${startDate || 'Siempre'} hasta ${endDate || 'Hoy'}</p>` : ''}
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Producto</th>
                            <th>Tipo</th>
                            <th>Cantidad</th>
                            <th>Balance</th>
                            <th>Razón/Referencia</th>
                            <th>Usuario</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        filteredMovements.forEach((m, i) => {
            const isEven = i % 2 === 0 ? 'row-even' : 'row-odd';
            const qtyColor = Number(m.quantity_change) > 0 ? 'text-green' : 'text-red';
            tableHtml += `
                <tr class="${isEven}">
                    <td>${format(new Date(m.created_at), "dd/MM/yyyy HH:mm")}</td>
                    <td class="font-bold">${m.product?.name || 'Producto Eliminado'}</td>
                    <td>${m.type}</td>
                    <td class="text-right ${qtyColor}">${Number(m.quantity_change) > 0 ? '+' : ''}${m.quantity_change}</td>
                    <td class="text-right">${m.stock_before ?? '-'} &rarr; ${m.stock_after ?? '-'}</td>
                    <td>${m.reason || '-'}</td>
                    <td>${m.user?.full_name || 'Sistema'}</td>
                </tr>
            `;
        });

        tableHtml += `</tbody></table></body></html>`;

        const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_Inventario_${format(new Date(), 'ddMMyyyy')}.xls`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportToPDF = () => {
        window.print();
    };

    return (
        <div className="space-y-4">
            <style jsx global>{`
                @media print {
                    @page { size: A4 landscape; margin: 15mm; }
                    body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    body * { visibility: hidden; }
                    .print-table-container, .print-table-container * { visibility: visible; }
                    .print-table-container { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; }
                    .print-header { display: block !important; padding-bottom: 20px; border-bottom: 2px solid #1e293b; margin-bottom: 20px; }
                    .print-table { width: 100%; border-collapse: collapse; font-family: ui-sans-serif, system-ui, sans-serif; }
                    .print-table th, .print-table td { border-bottom: 1px solid #e2e8f0; padding: 12px 8px; font-size: 11px; }
                    .print-table th { background-color: #f1f5f9 !important; color: #1e293b; text-transform: uppercase; font-weight: bold; }
                    .no-print { display: none !important; }
                    * { overflow: visible !important; }
                }
            `}</style>
            
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-border/40 dark:border-slate-800 shadow-sm no-print">
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="w-full md:w-auto">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Desde</label>
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-medium text-sm text-slate-700 dark:text-slate-200 w-full focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div className="w-full md:w-auto">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Hasta</label>
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-medium text-sm text-slate-700 dark:text-slate-200 w-full focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    {(startDate || endDate) && (
                        <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-slate-400 hover:text-slate-600 p-2 text-sm font-bold flex items-center gap-1 self-end mb-1">
                            <X size={14} /> Limpiar
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button 
                        onClick={exportToExcel}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#107c41]/10 text-[#107c41] px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-[#107c41]/20 transition-all"
                    >
                        <FileSpreadsheet size={16} /> Excel
                    </button>
                    <button 
                        onClick={exportToPDF}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                        <Printer size={16} /> PDF
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border/40 dark:border-slate-800 shadow-sm overflow-hidden print-table-container">
                {/* Print Only Header */}
                <div className="hidden print-header">
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 5px 0' }}>Reporte de Auditoría de Inventario</h1>
                    <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Generado por Vetinet Control System el {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
                    {(startDate || endDate) && <p style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>Filtro de Fechas: {startDate || 'Inicio'} a {endDate || 'Fin'}</p>}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left print-table">
                        <thead className="hidden md:table-header-group bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                        <tr>
                            <th className="px-6 py-4">Fecha</th>
                            <th className="px-6 py-4">Producto</th>
                            <th className="px-6 py-4">Tipo</th>
                            <th className="px-6 py-4 text-right">Cantidad</th>
                            <th className="px-6 py-4 text-center">Balance</th>
                            <th className="px-6 py-4">Razón/Referencia</th>
                            <th className="px-6 py-4">Usuario</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 flex flex-col md:table-row-group">
                        {currentMovements.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                    No hay movimientos que coincidan con los filtros
                                </td>
                            </tr>
                        ) : (
                            currentMovements.map((move) => {
                                const config = getTypeConfig(move.type);
                                return (
                                    <tr key={move.id} className="flex flex-col md:table-row p-4 md:p-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-0 md:px-6 py-2 md:py-4 flex justify-between md:table-cell items-center text-slate-500 whitespace-nowrap">
                                            <span className="md:hidden text-xs font-bold text-slate-400 uppercase">Fecha</span>
                                            {format(new Date(move.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                                        </td>
                                        <td className="px-0 md:px-6 py-2 md:py-4 flex justify-between md:table-cell items-start font-medium text-foreground dark:text-slate-200">
                                            <span className="md:hidden text-xs font-bold text-slate-400 uppercase mt-0.5">Producto</span>
                                            <div className="text-right md:text-left">
                                                {move.product?.name || <span className="text-slate-400 italic">Producto eliminado</span>}
                                                {move.product && <span className="text-xs text-slate-400 block">{move.product.category}</span>}
                                            </div>
                                        </td>
                                        <td className="px-0 md:px-6 py-2 md:py-4 flex justify-between md:table-cell items-center">
                                            <span className="md:hidden text-xs font-bold text-slate-400 uppercase">Tipo</span>
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${config.color}`}>
                                                {config.icon}
                                                {config.label}
                                            </span>
                                        </td>
                                        <td className={`px-0 md:px-6 py-2 md:py-4 flex justify-between md:table-cell items-center md:text-right font-bold ${Number(move.quantity_change) > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            <span className="md:hidden text-xs font-bold text-slate-400 uppercase">Cantidad</span>
                                            <div>
                                                {Number(move.quantity_change) > 0 ? '+' : ''}{Number(move.quantity_change)}
                                                {move.product && <span className="text-xs font-normal text-slate-400 ml-1">{move.product.unit}</span>}
                                            </div>
                                        </td>
                                        <td className="px-0 md:px-6 py-2 md:py-4 flex justify-between md:table-cell items-center md:text-center font-medium font-mono text-slate-500 text-xs">
                                            <span className="md:hidden text-xs font-bold text-slate-400 uppercase">Balance</span>
                                            <div>
                                                {move.stock_before ?? '-'} <span className="text-slate-300 dark:text-slate-600 mx-1">&rarr;</span> <span className="text-slate-800 dark:text-slate-100 font-bold">{move.stock_after ?? '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-0 md:px-6 py-2 md:py-4 flex justify-between md:table-cell items-center text-slate-600 max-w-full md:max-w-[200px] truncate" title={move.reason}>
                                            <span className="md:hidden text-xs font-bold text-slate-400 uppercase">Razón</span>
                                            <span className="truncate max-w-[200px]">{move.reason || "-"}</span>
                                        </td>
                                        <td className="px-0 md:px-6 py-2 md:py-4 flex justify-between md:table-cell items-center">
                                            <span className="md:hidden text-xs font-bold text-slate-400 uppercase">Usuario</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                                    {(move.user?.full_name || 'Sys').charAt(0)}
                                                </div>
                                                <span className="text-slate-600 dark:text-slate-300 truncate max-w-[120px]">{move.user?.full_name || 'Sistema'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-border/40 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between bg-slate-50 dark:bg-slate-800/30 gap-4 no-print">
                    <span className="text-sm font-medium text-slate-500">
                        Mostrando <strong className="text-slate-800 dark:text-slate-200">{(currentPage - 1) * itemsPerPage + 1}</strong> a <strong className="text-slate-800 dark:text-slate-200">{Math.min(currentPage * itemsPerPage, filteredMovements.length)}</strong> de <strong className="text-slate-800 dark:text-slate-200">{filteredMovements.length}</strong> movimientos
                    </span>
                    <div className="flex gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                        >
                            Anterior
                        </button>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}
        </div>
        </div>
    );
}
