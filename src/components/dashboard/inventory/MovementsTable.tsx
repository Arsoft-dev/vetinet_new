"use client";

import { ArrowDown, ArrowUp, RefreshCw, Filter, FileSpreadsheet, Printer, X } from "lucide-react";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx-js-style";

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
            case 'CONSUMPTION':
            case 'CONSUMO':
                return { color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400', icon: <ArrowUp size={14} />, label: "Autoconsumo" };
            case 'TRANSFER':
            case 'TRANSFERENCIA':
                return { color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400', icon: <RefreshCw size={14} />, label: "Transferencia" };
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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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

    // Exportación nativa .xlsx usando SheetJS (XLSX) con estilos profesionales
    const exportToExcel = () => {
        if (filteredMovements.length === 0) {
            return;
        }

        // 1. Título y bloque de información
        const titleRows = [
            ["VETINET ELITE — REPORTE DE MOVIMIENTOS E HISTORIAL DE KARDEX"],
            ["Sistema Inteligente de Gestión de Existencias y Auditoría Clínica"],
            [`Fecha de Reporte: ${format(new Date(), "dd/MM/yyyy HH:mm")}`],
            [startDate || endDate ? `Periodo: ${startDate || 'Inicio'} al ${endDate || 'Hoy'}` : "Periodo: Historial Completo"],
            [], // Espacio
            ["RESUMEN EJECUTIVO DE STOCK"],
            ["Total Movimientos", "Suma de Entradas", "Suma de Salidas", "Balance Neto de Stock"],
            [filteredMovements.length, totalEntradas, totalSalidas, balanceNeto],
            [], // Espacio
            ["DETALLE HISTÓRICO DE TRANSACCIONES"],
            ["Fecha y Hora", "Producto", "Almacén", "Tipo", "Cantidad", "Stock Inicial (Almacén)", "Stock Final (Almacén)", "Concepto / Razón", "Responsable"]
        ];

        // 2. Filas de datos formateadas
        const dataRows = filteredMovements.map(m => {
            const config = getTypeConfig(m.type);
            const qty = Number((m as any).quantity_change || 0);
            return [
                format(new Date(m.created_at), "dd/MM/yyyy HH:mm"),
                (m as any).product_name || "Producto Eliminado",
                (m as any).warehouse_name || "Principal",
                config.label,
                qty, // Número nativo para cálculos
                m.stock_before !== undefined && m.stock_before !== null ? Number(m.stock_before) : '-',
                m.stock_after !== undefined && m.stock_after !== null ? Number(m.stock_after) : '-',
                (m as any).reason || '-',
                (m as any).responsible_user || 'Sistema'
            ];
        });

        // 3. Crear hoja
        const allRows = [...titleRows, ...dataRows];
        const worksheet = XLSX.utils.aoa_to_sheet(allRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Historial Kardex");

        // 4. Configurar Merges (combinación de celdas)
        worksheet['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Título
            { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }, // Subtítulo
            { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } }, // Fecha
            { s: { r: 3, c: 0 }, e: { r: 3, c: 8 } }, // Filtros
            { s: { r: 5, c: 0 }, e: { r: 5, c: 3 } }, // Resumen Cabecera
            { s: { r: 9, c: 0 }, e: { r: 9, c: 8 } }  // Transacciones Cabecera
        ];

        // 5. Configurar anchos de columna automáticos
        const colWidths = [
            { wch: 20 }, // Fecha
            { wch: 30 }, // Producto
            { wch: 20 }, // Almacén
            { wch: 18 }, // Tipo
            { wch: 14 }, // Cantidad
            { wch: 15 }, // Stock Inicial
            { wch: 15 }, // Stock Final
            { wch: 45 }, // Razón (columna más ancha para evitar recortes)
            { wch: 22 }  // Responsable
        ];
        worksheet['!cols'] = colWidths;

        // 6. Configurar altos de filas predefinidos para cabeceras y títulos
        const rowHeights = [
            { hpt: 28 }, // Título (r=0)
            { hpt: 18 }, // Subtítulo (r=1)
            { hpt: 16 }, // Fecha (r=2)
            { hpt: 16 }, // Periodo (r=3)
            { hpt: 12 }, // Espacio (r=4)
            { hpt: 22 }, // Sección Resumen (r=5)
            { hpt: 20 }, // Cabeceras Resumen (r=6)
            { hpt: 22 }, // Valores Resumen (r=7)
            { hpt: 12 }, // Espacio (r=8)
            { hpt: 22 }, // Sección Detalle (r=9)
            { hpt: 24 }  // Cabeceras Detalle (r=10)
        ];
        worksheet['!rows'] = rowHeights;

        // 7. Aplicar estilos y diseño premium celda por celda
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:I1');
        const numRows = range.e.r + 1;
        const numCols = range.e.c + 1;

        const borderStyle = {
            top: { style: "thin", color: { rgb: "E2E8F0" } },
            bottom: { style: "thin", color: { rgb: "E2E8F0" } },
            left: { style: "thin", color: { rgb: "E2E8F0" } },
            right: { style: "thin", color: { rgb: "E2E8F0" } }
        };

        const borderDarkStyle = {
            top: { style: "thin", color: { rgb: "475569" } },
            bottom: { style: "thin", color: { rgb: "475569" } },
            left: { style: "thin", color: { rgb: "475569" } },
            right: { style: "thin", color: { rgb: "475569" } }
        };

        for (let r = 0; r < numRows; r++) {
            for (let c = 0; c < numCols; c++) {
                const cellRef = XLSX.utils.encode_cell({ r, c });
                if (!worksheet[cellRef]) {
                    // Inicializar celdas vacías dentro de los merges para aplicar fondos/bordes homogéneos
                    worksheet[cellRef] = { t: 'z', v: '' };
                }
                const cell = worksheet[cellRef];
                cell.s = {}; // Inicializar estilo

                // TÍTULO PRINCIPAL (A1:I1)
                if (r === 0) {
                    cell.s = {
                        font: { name: "Segoe UI", sz: 14, bold: true, color: { rgb: "0F172A" } },
                        alignment: { horizontal: "center", vertical: "center" }
                    };
                }
                // SUBTÍTULO (A2:I2)
                else if (r === 1) {
                    cell.s = {
                        font: { name: "Segoe UI", sz: 10, italic: true, color: { rgb: "475569" } },
                        alignment: { horizontal: "center", vertical: "center" }
                    };
                }
                // METADATOS (A3:I4)
                else if (r === 2 || r === 3) {
                    cell.s = {
                        font: { name: "Segoe UI", sz: 9, color: { rgb: "64748B" } },
                        alignment: { horizontal: "center", vertical: "center" }
                    };
                }
                // CABECERA RESUMEN EJECUTIVO (A6:D6)
                else if (r === 5) {
                    if (c <= 3) {
                        cell.s = {
                            fill: { fgColor: { rgb: "1E293B" } },
                            font: { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" }
                        };
                    }
                }
                // CABECERAS MÉTRICAS (A7:D7)
                else if (r === 6) {
                    if (c <= 3) {
                        cell.s = {
                            fill: { fgColor: { rgb: "F1F5F9" } },
                            font: { name: "Segoe UI", sz: 9, bold: true, color: { rgb: "475569" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            border: borderDarkStyle
                        };
                    }
                }
                // VALORES MÉTREGAS (A8:D8)
                else if (r === 7) {
                    if (c <= 3) {
                        let fontColor = "0F172A";
                        if (c === 1) fontColor = "16803D";      // Entradas (Verde)
                        else if (c === 2) fontColor = "B91C1C"; // Salidas (Rojo)
                        else if (c === 3) fontColor = balanceNeto >= 0 ? "16803D" : "B91C1C"; // Balance Neto

                        cell.s = {
                            fill: { fgColor: { rgb: "FFFFFF" } },
                            font: { name: "Segoe UI", sz: 11, bold: true, color: { rgb: fontColor } },
                            alignment: { horizontal: "center", vertical: "center" },
                            border: borderDarkStyle
                        };
                    }
                }
                // CABECERA SECCIÓN DETALLE (A10:I10)
                else if (r === 9) {
                    cell.s = {
                        fill: { fgColor: { rgb: "1E293B" } },
                        font: { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "FFFFFF" } },
                        alignment: { horizontal: "center", vertical: "center" }
                    };
                }
                // CABECERAS DE TABLA DETALLE (A11:I11)
                else if (r === 10) {
                    cell.s = {
                        fill: { fgColor: { rgb: "0F172A" } },
                        font: { name: "Segoe UI", sz: 9, bold: true, color: { rgb: "FFFFFF" } },
                        alignment: { horizontal: "center", vertical: "center" },
                        border: borderDarkStyle
                    };
                }
                // FILAS DE DATOS (A12 en adelante)
                else if (r >= 11) {
                    const isEven = r % 2 === 0;
                    const bgColor = isEven ? "F8FAFC" : "FFFFFF";
                    const isQuantityCol = c === 4;
                    let fontColor = "334155";
                    let isBold = false;

                    if (isQuantityCol) {
                        const val = Number(cell.v);
                        if (val > 0) fontColor = "16803D";
                        else if (val < 0) fontColor = "B91C1C";
                        isBold = true;
                    }

                    // Centrar contenidos de celdas por defecto; el motivo (columna index 7) salta de línea (wrapText)
                    const isReasonCol = c === 7;
                    const alignmentStyle = {
                        horizontal: "center",
                        vertical: "center",
                        wrapText: isReasonCol
                    };

                    cell.s = {
                        fill: { fgColor: { rgb: bgColor } },
                        font: { name: "Segoe UI", sz: 9, bold: isBold, color: { rgb: fontColor } },
                        alignment: alignmentStyle,
                        border: borderStyle
                    };
                }
            }
        }

        XLSX.writeFile(workbook, `Reporte_Inventario_${format(new Date(), 'ddMMyyyy_HHmm')}.xlsx`);
    };

    const exportToPDF = () => {
        window.print();
    };

    // Cálculos de métricas para el reporte de impresión
    const totalEntradas = filteredMovements
        .filter(m => (m as any).quantity_change > 0)
        .reduce((sum, m) => sum + Number((m as any).quantity_change), 0);

    const totalSalidas = filteredMovements
        .filter(m => (m as any).quantity_change < 0)
        .reduce((sum, m) => sum + Math.abs(Number((m as any).quantity_change)), 0);

    const balanceNeto = totalEntradas - totalSalidas;

    return (
        <div className="space-y-4">
            <style jsx global>{`
                @media print {
                    @page { size: A4 landscape; margin: 12mm; }
                    body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; color: #0f172a; }
                    body * { visibility: hidden; }
                    .print-report-container, .print-report-container * { visibility: visible; }
                    .print-report-container { position: absolute; left: 0; top: 0; width: 100%; display: block !important; }
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
                        <FileSpreadsheet size={16} /> Excel (.xlsx)
                    </button>
                    <button 
                        onClick={exportToPDF}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                        <Printer size={16} /> Imprimir PDF
                    </button>
                </div>
            </div>

            {/* VISTA EXCLUSIVA DE IMPRESIÓN (Invisible en pantalla, visible al imprimir) */}
            <div className="hidden print-report-container space-y-6">
                {/* Cabecera Corporativa */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading">VETINET ELITE</h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Control Inteligente de Inventarios</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-sm font-black uppercase text-slate-800 tracking-wide">Reporte de Auditoría e Historial</h2>
                        <p className="text-[10px] text-slate-500 font-medium mt-1">Generado: {mounted ? format(new Date(), "dd/MM/yyyy HH:mm") : ""}</p>
                        {(startDate || endDate) && (
                            <p className="text-[9px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-600 mt-1">
                                Rango: {startDate || "Inicio"} al {endDate || "Hoy"}
                            </p>
                        )}
                    </div>
                </div>

                {/* Resumen Métrico (Bento Print) */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Movimientos</span>
                        <h3 className="text-lg font-black text-slate-800 mt-1">{filteredMovements.length}</h3>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/50">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Entradas (+)</span>
                        <h3 className="text-lg font-black text-emerald-700 mt-1">+{totalEntradas}</h3>
                    </div>
                    <div className="p-3 bg-red-50 rounded-xl border border-red-200/50">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Salidas (-)</span>
                        <h3 className="text-lg font-black text-red-700 mt-1">-{totalSalidas}</h3>
                    </div>
                    <div className={`p-3 rounded-xl border ${balanceNeto >= 0 ? 'bg-emerald-50 border-emerald-200/50' : 'bg-red-50 border-red-200/50'}`}>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Balance Neto</span>
                        <h3 className={`text-lg font-black mt-1 ${balanceNeto >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                            {balanceNeto >= 0 ? `+${balanceNeto}` : balanceNeto}
                        </h3>
                    </div>
                </div>

                {/* Tabla de Impresión Completa sin Paginación */}
                <table className="w-full text-[10px] border-collapse">
                    <thead>
                        <tr className="bg-slate-100 text-[8px] font-black uppercase text-slate-700 tracking-wider text-left border-b border-slate-900">
                            <th className="py-2.5 px-3">Fecha</th>
                            <th className="py-2.5 px-3">Producto</th>
                            <th className="py-2.5 px-3">Almacén</th>
                            <th className="py-2.5 px-3">Tipo</th>
                            <th className="py-2.5 px-3 text-right">Cantidad</th>
                            <th className="py-2.5 px-3 text-center">Balance Almacén</th>
                            <th className="py-2.5 px-3">Motivo / Referencia</th>
                            <th className="py-2.5 px-3">Responsable</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {filteredMovements.map((move) => {
                            const config = getTypeConfig(move.type);
                            return (
                                <tr key={move.id} className="hover:bg-slate-50">
                                    <td className="py-2 px-3 text-slate-500 font-medium">
                                        {format(new Date(move.created_at), "dd/MM/yyyy HH:mm")}
                                    </td>
                                    <td className="py-2 px-3 font-bold text-slate-800">
                                        {(move as any).product_name || "N/A"}
                                    </td>
                                    <td className="py-2 px-3 font-bold text-slate-700">
                                        {(move as any).warehouse_name || "Principal"}
                                    </td>
                                    <td className="py-2 px-3">
                                        <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold ${config.color.split(' ')[0]} ${config.color.split(' ')[1]}`}>
                                            {config.label}
                                        </span>
                                    </td>
                                    <td className={`py-2 px-3 text-right font-bold ${(move as any).quantity_change >= 0 ? 'text-emerald-600' : 'text-red-650'}`}>
                                        {(move as any).quantity_change >= 0 ? '+' : ''}{(move as any).quantity_change}
                                    </td>
                                    <td className="py-2 px-3 text-center font-mono font-medium text-slate-500">
                                        <div className="flex flex-col items-center">
                                            <div>{move.stock_before ?? '-'} &rarr; {move.stock_after ?? '-'}</div>
                                            <span className="text-[8px] text-slate-400 font-sans mt-0.5">(en { (move as any).warehouse_name || "Principal" })</span>
                                        </div>
                                    </td>
                                    <td className="py-2 px-3 text-slate-600 font-medium whitespace-normal break-words">
                                        {(move as any).reason || "-"}
                                    </td>
                                    <td className="py-2 px-3 font-bold text-slate-700">
                                        {(move as any).responsible_user || "Sistema"}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border/40 dark:border-slate-800 shadow-sm overflow-hidden print-table-container no-print">
                <div className="w-full overflow-x-auto scrollbar-thin">
                    <table className="w-full min-w-[950px] text-sm text-left">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Producto</th>
                                <th className="px-6 py-4">Almacén</th>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4 text-right">Cantidad</th>
                                <th className="px-6 py-4 text-center">Balance Almacén</th>
                                <th className="px-6 py-4">Razón/Referencia</th>
                                <th className="px-6 py-4">Usuario</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {currentMovements.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                                        No hay movimientos que coincidan con los filtros
                                    </td>
                                </tr>
                            ) : (
                                currentMovements.map((move) => {
                                    const config = getTypeConfig(move.type);
                                    return (
                                        <tr key={move.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                                {format(new Date(move.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-700 dark:text-slate-200">{(move as any).product_name || "N/A"}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-bold whitespace-nowrap">
                                                {(move as any).warehouse_name || "Principal"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${config.color}`}>
                                                    {config.icon}
                                                    {config.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className={`font-black ${(move as any).quantity_change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {(move as any).quantity_change >= 0 ? '+' : ''}{(move as any).quantity_change}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-medium font-mono text-slate-500 text-xs">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div>
                                                        <span className="text-slate-500 dark:text-slate-400">{move.stock_before ?? '-'}</span> 
                                                        <span className="text-slate-300 dark:text-slate-600 mx-1.5">&rarr;</span> 
                                                        <span className="text-slate-800 dark:text-slate-100 font-bold">{move.stock_after ?? '-'}</span>
                                                    </div>
                                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-sans mt-0.5 font-normal">(en { (move as any).warehouse_name || "Principal" })</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-left text-xs font-medium text-slate-500 line-clamp-2 max-w-[200px] whitespace-normal break-words" title={(move as any).reason}>
                                                    {(move as any).reason || "-"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 justify-start">
                                                    <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                        {(move as any).responsible_user?.charAt(0) || "S"}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{(move as any).responsible_user || "Sistema"}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
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
    );
}
