"use client";

import { useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PrintTrigger } from "@/components/dashboard/print/PrintTrigger";

const reasonLabels: Record<string, string> = {
    'counting_error': 'Error de Conteo / Rectificación',
    'clinical_omission': 'Omisión de Registro Clínico',
    'damaged_expired': 'Producto Dañado / Vencido',
    'unexplained_loss': 'Pérdida Inexplicable / Hurto',
    'unexplained_surplus': 'Sobrante Inexplicable'
};

interface InventoryAuditTemplateProps {
    audit: any;
}

export function InventoryAuditTemplate({ audit }: InventoryAuditTemplateProps) {

    useEffect(() => {
        // Opcional: imprimir automáticamente
    }, []);

    const statusLabels: Record<string, string> = {
        'draft': 'Borrador / En Conteo',
        'confirmed': 'Confirmada y Ajustada',
        'canceled': 'Cancelada'
    };

    return (
        <div className="bg-slate-100 dark:bg-slate-950 min-h-screen py-8 print:bg-white print:p-0 print:py-0 print:min-h-0 font-mono text-sm transition-colors duration-500 text-black">
            
            {/* CONTROLES (Solo pantalla) */}
            <div className="max-w-[21cm] mx-auto mb-6 flex justify-between items-center print:hidden px-4">
                <div className="flex flex-col">
                    <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">Auditoría de Stock: AUD-{audit.id.slice(0, 8).toUpperCase()}</h2>
                    <p className="text-xs text-slate-500">Vista de impresión de toma física de inventario</p>
                </div>
                <PrintTrigger />
            </div>

            {/* LIENZO DE IMPRESIÓN (Canvas A4) */}
            <div className="mx-auto bg-white dark:bg-white text-black dark:text-black shadow-xl print:shadow-none print:m-0 overflow-hidden max-w-[21cm] min-h-[29.7cm] print:min-h-0 p-8 border border-gray-200 print:border-none rounded-lg print:rounded-none">
                
                {/* CABECERA */}
                <header className="mb-8 flex justify-between items-start border-b-2 border-gray-300 pb-6">
                    <div className="flex gap-4 items-start">
                        {audit.clinic?.logo_url ? (
                            <img 
                                src={audit.clinic.logo_url} 
                                alt="Logo" 
                                className="w-16 h-16 object-contain"
                            />
                        ) : (
                            <div className="flex flex-col items-center">
                                <img src="/icono.png" alt="Vetinet Icon" className="w-16 h-16 object-contain" />
                                <span className="text-[9px] font-black text-emerald-600 tracking-widest">VETINET</span>
                            </div>
                        )}
                        <div>
                            <h1 className="text-lg font-bold uppercase tracking-wider">{audit.clinic?.name || "Clínica Veterinaria"}</h1>
                            <p className="text-gray-600 text-xs leading-tight mt-1">
                                {audit.clinic?.address || "Dirección Fiscal de la Clínica"}
                            </p>
                            <p className="text-gray-600 text-xs mt-1">
                                RIF: {audit.clinic?.rif || "J-00000000-0"} • Tel: {audit.clinic?.phone || "-"}
                            </p>
                        </div>
                    </div>

                    <div className="text-right">
                        <h2 className="text-base font-black text-gray-900 uppercase">Toma Física de Stock</h2>
                        <p className="font-bold text-sm mt-1 text-amber-600">AUD-{audit.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            Estado: <span className="font-bold uppercase">{statusLabels[audit.status] || audit.status}</span>
                        </p>
                        <p className="text-xs mt-2 font-medium">
                            Fecha Inicio: {format(new Date(audit.created_at), "dd/MM/yyyy h:mm a", { locale: es })}
                        </p>
                    </div>
                </header>

                {/* INFORMACIÓN DE LA AUDITORÍA */}
                <section className="mb-8 grid grid-cols-2 gap-4">
                    {/* Almacén */}
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                        <h3 className="font-bold uppercase text-xs text-gray-400 mb-2 border-b border-gray-200 pb-1">Ubicación Auditada</h3>
                        <div className="space-y-1 text-xs">
                            <p><span className="font-bold text-gray-500">Almacén:</span> <span className="font-bold text-gray-950 uppercase">{audit.warehouse?.name || "General"}</span></p>
                            <p><span className="font-bold text-gray-500">Tipo Almacén:</span> <span className="uppercase">{audit.warehouse?.type || "storage"}</span></p>
                        </div>
                    </div>

                    {/* Responsable */}
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold uppercase text-xs text-gray-400 mb-2 border-b border-gray-200 pb-1">Personal de Inventario</h3>
                            <div className="space-y-1 text-xs">
                                <p><span className="font-bold text-gray-500">Auditor responsable:</span> <span className="font-bold text-gray-950 uppercase">{audit.user?.full_name || "Sistema"}</span></p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* TABLA DE DISCREPANCIAS */}
                <div className="mb-6">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b-2 border-black uppercase text-gray-600 font-bold">
                                <th className="py-2">Código/Barcode</th>
                                <th className="py-2">Producto y Motivo</th>
                                <th className="py-2">Lote</th>
                                <th className="py-2 text-right">P. Unitario</th>
                                <th className="py-2 text-right">Esperado</th>
                                <th className="py-2 text-right">Real</th>
                                <th className="py-2 text-right pr-2">Ajuste / Impacto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 font-medium text-gray-800">
                            {audit.items.map((item: any, index: number) => {
                                const expected = Number(item.expected_quantity);
                                const actual = Number(item.actual_quantity);
                                const discrepancy = actual - expected;
                                const price = Number(item.product?.sale_price || 0);
                                const impact = discrepancy * price;

                                return (
                                    <tr key={index}>
                                        <td className="py-3 font-mono text-gray-400">{item.product?.barcode || "S/B"}</td>
                                        <td className="py-3 pr-2">
                                            <div className="font-bold text-gray-900">{item.product?.name}</div>
                                            {discrepancy !== 0 && (
                                                <div className="text-[10px] text-gray-500 italic mt-0.5 space-y-0.5">
                                                    {item.discrepancy_reason ? (
                                                        <div><span className="font-bold text-gray-700">Causa:</span> {reasonLabels[item.discrepancy_reason] || item.discrepancy_reason}</div>
                                                    ) : (
                                                        <div className="text-amber-600"><span className="font-bold">Sugerencia:</span> {item.suggested_pista}</div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 font-mono text-gray-600">{item.batch?.batch_number || "GENÉRICO"}</td>
                                        <td className="py-3 text-right font-mono">${price.toFixed(2)}</td>
                                        <td className="py-3 text-right">{expected} <span className="text-[10px] text-gray-450 lowercase">{item.product?.unit || "und"}</span></td>
                                        <td className="py-3 text-right font-bold">{actual} <span className="text-[10px] text-gray-450 lowercase">{item.product?.unit || "und"}</span></td>
                                        <td className="py-3 text-right pr-2 font-mono">
                                            <div className={`font-bold ${
                                                discrepancy === 0 
                                                    ? 'text-gray-500' 
                                                    : discrepancy > 0 
                                                        ? 'text-emerald-600' 
                                                        : 'text-red-650'
                                            }`}>
                                                {discrepancy === 0 ? "Sin Novedad" : discrepancy > 0 ? `+${discrepancy}` : discrepancy}
                                            </div>
                                            {discrepancy !== 0 && (
                                                <div className={`text-[10px] font-bold ${discrepancy > 0 ? 'text-emerald-600' : 'text-red-650'}`}>
                                                    {discrepancy > 0 ? `+$${impact.toFixed(2)}` : `-$${Math.abs(impact).toFixed(2)}`}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* RESUMEN DE LA VALORIZACIÓN */}
                {(() => {
                    const totalExpectedVal = audit.items.reduce((acc: number, item: any) => acc + (Number(item.expected_quantity) * Number(item.product?.sale_price || 0)), 0);
                    const totalActualVal = audit.items.reduce((acc: number, item: any) => acc + (Number(item.actual_quantity) * Number(item.product?.sale_price || 0)), 0);
                    const netDiscrepancyVal = totalActualVal - totalExpectedVal;
                    const itemsCount = audit.items.length;
                    const discrepanciesCount = audit.items.filter((item: any) => Number(item.actual_quantity) !== Number(item.expected_quantity)).length;

                    return (
                        <section className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50/50 flex justify-between items-center text-xs">
                            <div>
                                <h4 className="font-bold text-gray-500 uppercase text-[10px] tracking-wider mb-1">Resumen del Conteo</h4>
                                <p>Total ítems auditados: <span className="font-bold">{itemsCount} lotes</span></p>
                                <p>Ítems con discrepancia: <span className="font-bold text-amber-600">{discrepanciesCount} lotes</span></p>
                            </div>
                            <div className="text-right space-y-0.5">
                                <h4 className="font-bold text-gray-500 uppercase text-[10px] tracking-wider mb-1">Valorización del Ajuste</h4>
                                <p><span className="text-gray-500">Valor Esperado:</span> <span className="font-bold">${totalExpectedVal.toFixed(2)}</span></p>
                                <p><span className="text-gray-500">Valor Real Contado:</span> <span className="font-bold">${totalActualVal.toFixed(2)}</span></p>
                                <p className="border-t border-gray-300 pt-1 mt-1">
                                    <span className="text-gray-500 font-bold">Ajuste Neto:</span>{" "}
                                    <span className={`font-black ${netDiscrepancyVal === 0 ? 'text-gray-650' : netDiscrepancyVal > 0 ? 'text-emerald-650' : 'text-red-650'}`}>
                                        {netDiscrepancyVal === 0 ? "$0.00" : netDiscrepancyVal > 0 ? `+$${netDiscrepancyVal.toFixed(2)}` : `-$${Math.abs(netDiscrepancyVal).toFixed(2)}`}
                                    </span>
                                </p>
                            </div>
                        </section>
                    );
                })()}

                {/* OBSERVACIONES */}
                {audit.notes && (
                    <section className="mb-12 p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50/30">
                        <h4 className="font-bold text-xs text-gray-500 uppercase tracking-wider mb-2">Observaciones de la Toma Física</h4>
                        <p className="text-xs text-gray-650 italic leading-relaxed whitespace-pre-wrap">{audit.notes}</p>
                    </section>
                )}

                {/* ÁREA DE FIRMAS */}
                <section className="mt-16 grid grid-cols-2 gap-16 text-center text-xs">
                    <div className="flex flex-col items-center">
                        <div className="w-56 border-b border-gray-400 h-16 mb-2"></div>
                        <p className="font-bold text-gray-800">Firma del Auditor Responsable</p>
                        <p className="text-gray-400 text-[10px] uppercase">{audit.user?.full_name || "Auditor"}</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-56 border-b border-gray-400 h-16 mb-2"></div>
                        <p className="font-bold text-gray-800">Firma del Administrador de Clínica</p>
                        <p className="text-gray-400 text-[10px] uppercase">Control y Conformidad</p>
                    </div>
                </section>

                {/* PIE DE PÁGINA */}
                <footer className="mt-16 text-center text-[10px] text-gray-400 border-t border-gray-100 pt-4">
                    <p>Este documento constituye un acta mercantil formal de tomas físicas e inventarios de {audit.clinic?.name || "nuestra clínica"}.</p>
                    <p>Desarrollado y Gestionado por Vetinet Elite.</p>
                </footer>
            </div>
        </div>
    );
}
