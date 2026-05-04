"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PrintTrigger } from "@/components/dashboard/print/PrintTrigger";
import { Printer, FileText, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

interface InvoiceTemplateProps {
    invoice: any;
}

import { useSearchParams } from "next/navigation";

// ...

export function InvoiceTemplate({ invoice }: InvoiceTemplateProps) {
    const searchParams = useSearchParams();
    const [isTicket, setIsTicket] = useState(searchParams.get("format") === "ticket");

    useEffect(() => {
        if (isTicket) {
            // Small delay to ensure render
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [isTicket]);

    // Format Helpers
    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat("es-VE", {
            style: "currency",
            currency: currency === 'VES' ? 'VES' : 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    return (
        <div className="bg-slate-100 dark:bg-slate-950 min-h-screen py-8 print:bg-white print:p-0 font-mono text-sm transition-colors duration-500">

            {/* CONTROLS (Screen Only) */}
            <div className="max-w-[21cm] mx-auto mb-6 flex justify-between items-center print:hidden px-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsTicket(false)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                            !isTicket ? "bg-primary text-white shadow-lg" : "bg-white text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        <FileText size={18} />
                        <span>Carta (PDF)</span>
                    </button>
                    <button
                        onClick={() => setIsTicket(true)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                            isTicket ? "bg-primary text-white shadow-lg" : "bg-white text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        <Receipt size={18} />
                        <span>Ticket (80mm)</span>
                    </button>
                </div>
                <PrintTrigger />
            </div>

            {/* INVOICE CANVAS */}
            <div
                className={cn(
                    "mx-auto bg-white dark:bg-white text-black dark:text-black shadow-xl print:shadow-none print:m-0 overflow-hidden transition-all duration-300",
                    isTicket ? "max-w-[80mm] min-h-[auto] p-2 text-[10px]" : "max-w-[21cm] min-h-[29.7cm] p-8"
                )}
            >
                {/* HEADER */}
                <header className={cn(
                    "mb-4 flex flex-col items-center text-center border-b-2 border-dashed border-gray-300 pb-4",
                    !isTicket && "mb-8 flex-row justify-between items-start text-left pb-6"
                )}>
                    <div className={cn("flex flex-col items-center", !isTicket && "flex-row items-start gap-4")}>
                        {/* Logo con fallback a Vetinet Square - HIDE IN TICKET */}
                        {!isTicket && (
                            <>
                                {invoice.clinic?.logo_url ? (
                                    <img 
                                        src={invoice.clinic.logo_url} 
                                        alt="Logo" 
                                        className="w-20 h-20 object-contain mb-2"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center mb-2">
                                        <img src="/icono.png" alt="Vetinet Icon" className="w-20 h-20 object-contain" />
                                        <span className="text-[10px] font-black text-emerald-600 -mt-1 tracking-widest">VETINET</span>
                                    </div>
                                )}
                            </>
                        )}

                        <div>
                            <h1 className="text-xl font-bold uppercase tracking-wider">{invoice.clinic?.name || "Clínica Veterinaria"}</h1>
                            <p className="text-gray-600 leading-tight mt-1">
                                {invoice.clinic?.address || "Dirección Fiscal no registrada"}
                            </p>
                            <p className="text-gray-600 mt-1">
                                RIF: {invoice.clinic?.rif || "J-00000000-0"} • Tel: {invoice.clinic?.phone}
                            </p>
                        </div>
                    </div>

                    <div className={cn("mt-4 text-center", !isTicket && "mt-0 text-right")}>
                        <h2 className="text-lg font-bold text-gray-900 uppercase">Factura Fiscal</h2>
                        <p className="font-bold text-base mt-1">Nro: {String(invoice.invoice_number).padStart(8, '0')}</p>
                        {invoice.control_number && (
                            <p className="text-gray-500">Control: {invoice.control_number}</p>
                        )}
                        <p className="font-medium mt-2">
                            Fecha: {format(new Date(invoice.created_at), "dd/MM/yyyy h:mm a", { locale: es })}
                        </p>
                    </div>
                </header>

                {/* CLIENT INFO */}
                <section className={cn(
                    "mb-4 border-b border-gray-300 pb-4",
                    !isTicket && "mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50/50"
                )}>
                    {isTicket ? (
                        <div className="space-y-1">
                            <p><span className="font-bold">Cliente:</span> {invoice.client_name}</p>
                            <p><span className="font-bold">CI/RIF:</span> {invoice.client_id_number}</p>
                            {invoice.client_address && <p className="truncate"><span className="font-bold">Dir:</span> {invoice.client_address}</p>}
                        </div>
                    ) : (
                        <>
                            <h3 className="font-bold uppercase text-xs text-gray-400 mb-2 border-b border-gray-200 pb-1">Datos del Cliente</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block text-xs text-gray-500">Razón Social / Nombre:</span>
                                    <span className="font-bold text-base uppercase">{invoice.client_name}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-gray-500">CI / RIF:</span>
                                    <span className="font-bold text-base uppercase">{invoice.client_id_number}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="block text-xs text-gray-500">Dirección:</span>
                                    <span className="text-gray-900">{invoice.client_address || "No registrada"}</span>
                                </div>
                            </div>
                        </>
                    )}
                </section>

                {/* ITEMS TABLE */}
                <div className="mb-4">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-black uppercase text-gray-600 font-bold">
                                <th className="py-2 w-8 text-center">Cnt</th>
                                <th className="py-2">Desc</th>
                                {!isTicket && <th className="py-2 text-right">P. Unit</th>}
                                <th className="py-2 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200/50 font-medium">
                            {invoice.items.map((item: any) => (
                                <tr key={item.id}>
                                    <td className="py-2 text-center align-top">{item.quantity}</td>
                                    <td className="py-2 align-top">
                                        <p>{item.description}</p>
                                        {/* In Ticket mode, show unit price below desc */}
                                        {isTicket && (
                                            <p className="text-[9px] text-gray-400">
                                                {formatCurrency(item.unit_price, invoice.currency)} c/u
                                            </p>
                                        )}
                                    </td>
                                    {!isTicket && (
                                        <td className="py-2 text-right align-top">
                                            {formatCurrency(item.unit_price, invoice.currency)}
                                        </td>
                                    )}
                                    <td className="py-2 text-right align-top font-bold">
                                        {formatCurrency(item.total_price, invoice.currency)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* TOTALS */}
                <div className={cn("flex flex-col gap-2 border-t border-black pt-4", !isTicket && "items-end mt-6")}>
                    <div className={cn("space-y-1", !isTicket && "w-64 text-right")}>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Subtotal:</span>
                            <span>{formatCurrency(invoice.subtotal || invoice.total_amount, invoice.currency)}</span>
                        </div>
                        {invoice.iva_amount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">I.V.A (16%):</span>
                                <span>{formatCurrency(invoice.iva_amount, invoice.currency)}</span>
                            </div>
                        )}
                        {invoice.igtf_amount > 0 && (
                            <div className="flex justify-between text-gray-500">
                                <span>IGTF (3%):</span>
                                <span>{formatCurrency(invoice.igtf_amount, invoice.currency)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xl font-black border-t-2 border-dashed border-gray-300 pt-2 mt-2">
                            <span>TOTAL:</span>
                            <span>{formatCurrency(invoice.total_amount, invoice.currency)}</span>
                        </div>
                        {invoice.currency === 'VES' && invoice.exchange_rate > 0 && (
                            <p className="text-[10px] text-gray-400 mt-2 text-center">
                                Tasa: {invoice.exchange_rate} Bs/USD
                            </p>
                        )}
                    </div>
                </div>

                {/* FOOTER */}
                <footer className="mt-8 text-center text-[10px] text-gray-400 border-t border-gray-100 pt-4">
                    <p>Emitido por Vetinet.</p>
                    <p>Providencia SENIAT/0000/0000</p>
                    {!isTicket && <p className="mt-2 uppercase">Original: Cliente • Copia: Contabilidad</p>}
                </footer>
            </div>
        </div>
    );
}
