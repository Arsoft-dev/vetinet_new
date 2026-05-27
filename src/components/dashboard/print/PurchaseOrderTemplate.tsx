"use client";

import { useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PrintTrigger } from "@/components/dashboard/print/PrintTrigger";

interface PurchaseOrderTemplateProps {
    order: any;
}

export function PurchaseOrderTemplate({ order }: PurchaseOrderTemplateProps) {

    useEffect(() => {
        // Ejecutar impresión automática al abrir si el usuario lo desea
        // setTimeout(() => { window.print(); }, 500);
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2
        }).format(amount);
    };

    const statusLabels: Record<string, string> = {
        'pending': 'Borrador / Pendiente',
        'ordered': 'Ordenada / Enviada',
        'received': 'Recibida',
        'canceled': 'Cancelada'
    };

    return (
        <div className="bg-slate-100 dark:bg-slate-950 min-h-screen py-8 print:bg-white print:p-0 print:py-0 print:min-h-0 font-mono text-sm transition-colors duration-500 text-black">
            
            {/* CONTROLS (Screen Only) */}
            <div className="max-w-[21cm] mx-auto mb-6 flex justify-between items-center print:hidden px-4">
                <div className="flex flex-col">
                    <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">Orden de Compra: {order.order_number}</h2>
                    <p className="text-xs text-slate-500">Vista de impresión de documento comercial</p>
                </div>
                <PrintTrigger />
            </div>

            {/* CANVAS */}
            <div className="mx-auto bg-white dark:bg-white text-black dark:text-black shadow-xl print:shadow-none print:m-0 overflow-hidden max-w-[21cm] min-h-[29.7cm] print:min-h-0 p-8 border border-gray-200 print:border-none rounded-lg print:rounded-none">
                
                {/* HEADER */}
                <header className="mb-8 flex justify-between items-start border-b-2 border-gray-300 pb-6">
                    <div className="flex gap-4 items-start">
                        {order.clinic?.logo_url ? (
                            <img 
                                src={order.clinic.logo_url} 
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
                            <h1 className="text-lg font-bold uppercase tracking-wider">{order.clinic?.name || "Clínica Veterinaria"}</h1>
                            <p className="text-gray-600 text-xs leading-tight mt-1">
                                {order.clinic?.address || "Dirección Fiscal de la Clínica"}
                            </p>
                            <p className="text-gray-600 text-xs mt-1">
                                RIF: {order.clinic?.rif || "J-00000000-0"} • Tel: {order.clinic?.phone || "-"}
                            </p>
                        </div>
                    </div>

                    <div className="text-right">
                        <h2 className="text-base font-black text-gray-900 uppercase">Orden de Compra</h2>
                        <p className="font-bold text-sm mt-1 text-blue-600">{order.order_number}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            Estado: <span className="font-bold uppercase">{statusLabels[order.status] || order.status}</span>
                        </p>
                        <p className="text-xs mt-2 font-medium">
                            Fecha Emisión: {format(new Date(order.created_at), "dd/MM/yyyy h:mm a", { locale: es })}
                        </p>
                    </div>
                </header>

                {/* INFO SECTION */}
                <section className="mb-8 grid grid-cols-2 gap-4">
                    {/* Proveedor */}
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                        <h3 className="font-bold uppercase text-xs text-gray-400 mb-2 border-b border-gray-200 pb-1">Datos del Proveedor</h3>
                        <div className="space-y-1 text-xs">
                            <p><span className="font-bold text-gray-500">Nombre:</span> <span className="font-bold text-gray-950 uppercase">{order.supplier?.name}</span></p>
                            {order.supplier?.tax_id && <p><span className="font-bold text-gray-500">RIF/ID:</span> {order.supplier.tax_id}</p>}
                            {order.supplier?.contact_person && <p><span className="font-bold text-gray-500">Contacto:</span> {order.supplier.contact_person}</p>}
                            {order.supplier?.phone && <p><span className="font-bold text-gray-500">Teléfono:</span> {order.supplier.phone}</p>}
                            {order.supplier?.email && <p><span className="font-bold text-gray-500">Email:</span> {order.supplier.email}</p>}
                            {order.supplier?.address && <p className="mt-2 text-gray-600"><span className="font-bold text-gray-500">Dir:</span> {order.supplier.address}</p>}
                        </div>
                    </div>

                    {/* Entrega e Emisor */}
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold uppercase text-xs text-gray-400 mb-2 border-b border-gray-200 pb-1">Ubicación de Destino</h3>
                            <div className="space-y-1 text-xs">
                                <p><span className="font-bold text-gray-500">Almacén:</span> <span className="font-bold text-gray-950 uppercase">{order.warehouse?.name}</span></p>
                            </div>
                        </div>
                        <div className="mt-4 pt-2 border-t border-gray-200 text-xs">
                            <p><span className="font-bold text-gray-500">Emitido Por:</span> {order.issuer?.full_name || "Usuario Demo"}</p>
                            {order.received_at && (
                                <p className="text-emerald-600 font-bold mt-1">
                                    ✓ Recibido: {format(new Date(order.received_at), "dd/MM/yyyy", { locale: es })}
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* ITEMS TABLE */}
                <div className="mb-8">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b-2 border-black uppercase text-gray-600 font-bold">
                                <th className="py-2">Código</th>
                                <th className="py-2">Producto</th>
                                <th className="py-2 text-center">Cant. Solicitada</th>
                                <th className="py-2 text-center">Cant. Recibida</th>
                                <th className="py-2 text-right">P. Unitario</th>
                                <th className="py-2 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 font-medium text-gray-800">
                            {order.items.map((item: any, index: number) => (
                                <tr key={index}>
                                    <td className="py-2 font-mono text-gray-400">{item.product?.barcode || "S/B"}</td>
                                    <td className="py-2 font-bold">{item.product?.name}</td>
                                    <td className="py-2 text-center">{Number(item.quantity)} <span className="text-[10px] text-gray-400 lowercase">{item.product?.unit || "und"}</span></td>
                                    <td className="py-2 text-center">
                                        {order.status === 'received' ? (
                                            <span>{Number(item.received_quantity)} {item.product?.unit || "und"}</span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="py-2 text-right">{formatCurrency(Number(item.unit_price))}</td>
                                    <td className="py-2 text-right font-bold text-blue-600">{formatCurrency(Number(item.quantity) * Number(item.unit_price))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* TOTAL */}
                <div className="flex flex-col items-end gap-2 border-t border-black pt-4 mt-6">
                    <div className="w-72 text-right space-y-1 text-xs">
                        <div className="flex justify-between text-sm font-black border-t-2 border-dashed border-gray-300 pt-2 mt-2">
                            <span>TOTAL ESTIMADO:</span>
                            <span className="text-emerald-600 text-base">{formatCurrency(Number(order.total_amount_usd))}</span>
                        </div>
                    </div>
                </div>

                {/* OBSERVACIONES */}
                {order.notes && (
                    <section className="mt-8 p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50/30">
                        <h4 className="font-bold text-xs text-gray-500 uppercase tracking-wider mb-2">Instrucciones Especiales y Observaciones</h4>
                        <p className="text-xs text-gray-650 italic leading-relaxed whitespace-pre-wrap">{order.notes}</p>
                    </section>
                )}

                {/* FOOTER */}
                <footer className="mt-12 text-center text-[10px] text-gray-400 border-t border-gray-100 pt-4">
                    <p>Este documento es una orden de compra mercantil formal emitida por {order.clinic?.name || "nuestra institución"}.</p>
                    <p>Desarrollado y Gestionado por Vetinet Elite.</p>
                </footer>
            </div>
        </div>
    );
}
