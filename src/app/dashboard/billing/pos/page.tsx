import { getRateContext, syncExchangeRate } from "@/actions/exchange-rates";
// import { POSWorkspace } from "@/components/dashboard/billing/POSWorkspace"; // Legacy Vertical Layout
import { POSWorkspaceThreeColumn } from "@/components/dashboard/billing/POSWorkspaceThreeColumn"; // New Horizon Layout
import { ArrowLeft, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function POSPage() {
    await syncExchangeRate();
    const rateContext = await getRateContext();
    const exchangeRate = rateContext?.activeRate || 0;

    return (
        <div className="flex flex-col h-[calc(100vh-60px)] md:h-[calc(100vh-100px)] overflow-hidden">


            {/* Minimalist POS Header */}
            <div className="flex items-center justify-between mb-4 pt-2 shrink-0">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard/billing">
                        <button className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl transition-all shadow-sm">
                            <ArrowLeft size={24} />
                        </button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">Punto de Venta</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sistema Fiscal Conectado</p>
                        </div>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-4 bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Tasa {rateContext?.isManual ? 'Manual' : 'Oficial'}</p>
                        <p className="font-black text-lg text-emerald-600">{exchangeRate.toFixed(2)} <span className="text-xs">Bs/{rateContext?.preferredCurrency}</span></p>
                    </div>
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                        <TrendingUp size={20} />
                    </div>
                    {rateContext?.isBelowOfficial && (
                        <div className="absolute -bottom-8 right-0 flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg shadow-sm whitespace-nowrap">
                            <AlertCircle className="text-red-600 w-3 h-3" />
                            <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                                ¡Por debajo del BCV Oficial ({rateContext.officialRate})!
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Interactive Workspace - New 3-Column Layout */}
            <div className="flex-1 min-h-0 relative">
                <POSWorkspaceThreeColumn exchangeRate={exchangeRate} />
            </div>
        </div>
    );
}
