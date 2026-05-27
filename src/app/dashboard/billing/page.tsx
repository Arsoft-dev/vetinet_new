import { getInvoices } from "@/actions/billing";
import { getRateContext, syncExchangeRate } from "@/actions/exchange-rates";
import { Receipt, Plus, TrendingUp, Wallet, Banknote } from "lucide-react";
import Link from "next/link";
import { InvoiceTable } from "@/components/dashboard/billing/InvoiceTable";

import { isBillingEnabled } from "@/actions/clinic-actions";
import { redirect } from "next/navigation";

export default async function BillingPage() {
    // Fetch a larger set of invoices for the list
    const invoices = await getInvoices(100); 
    await syncExchangeRate();
    const rateContext = await getRateContext();
    const currentExchangeRate = rateContext?.activeRate || 0;

    // Calculate Today's Stats
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysInvoices = invoices.filter(inv => inv.created_at.startsWith(todayStr) && inv.status !== 'canceled');
    
    const ventasDelDiaUSD = todaysInvoices.reduce((acc, inv) => {
        const usdValue = inv.total_amount_usd ? inv.total_amount_usd : (inv.total_amount / (inv.exchange_rate || 1));
        return acc + usdValue;
    }, 0);

    const efectivoEnCajaUSD = ventasDelDiaUSD; 

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-4">
                        <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-500/20">
                            <Receipt size={24} />
                        </div>
                        Facturación y Caja
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Control de ingresos, facturas fiscales y flujo de efectivo.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Link href="/dashboard/billing/cash">
                        <button className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800 shadow-sm">
                            <Wallet size={16} />
                            Control de Caja
                        </button>
                    </Link>
                    <Link href="/dashboard/billing/pos">
                        <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 hover:-translate-y-0.5 active:scale-95">
                            <Plus size={18} />
                            Nueva Venta
                        </button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-border/10 dark:border-slate-800 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ventas del Día</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">${ventasDelDiaUSD.toFixed(2)}</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-border/10 dark:border-slate-800 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl group-hover:scale-110 transition-transform">
                        <Banknote size={24} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tasa {rateContext?.isManual ? 'Manual' : 'Oficial'}</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                            {currentExchangeRate.toFixed(2)} 
                            <span className="text-[10px] ml-1.5 font-bold text-slate-400">Bs/USD</span>
                        </h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-border/10 dark:border-slate-800 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Flujo Neto Hoy</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">${efectivoEnCajaUSD.toFixed(2)}</h3>
                    </div>
                </div>
            </div>

            {/* Invoices List with Pagination */}
            <InvoiceTable initialInvoices={invoices} />
        </div>
    );
}
