"use client";

import { useState, useEffect } from "react";
import { getCurrentCashRegister, openCashRegister, getCashRegisterTotals, closeCashRegister, getClosedCashRegisters } from "@/actions/cash";
import { Lock, Unlock, DollarSign, Wallet, Banknote, CreditCard, Terminal, Receipt, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CashRegisterPage() {
    const router = useRouter();
    const [register, setRegister] = useState<any>(null);
    const [totals, setTotals] = useState<any>(null);
    const [closedRegisters, setClosedRegisters] = useState<any[]>([]);
    const [historyDate, setHistoryDate] = useState<string>("");
    const [historyPage, setHistoryPage] = useState(1);
    const [loading, setLoading] = useState(true);

    // Open Form State
    const [initialUSD, setInitialUSD] = useState("0");
    const [initialVES, setInitialVES] = useState("0");

    // Close Form State
    const [countedUSD, setCountedUSD] = useState("");
    const [countedVES, setCountedVES] = useState("");
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const active = await getCurrentCashRegister();
        setRegister(active);
        if (active) {
            const aggs = await getCashRegisterTotals(active.id);
            setTotals(aggs);
        } else {
            const closed = await getClosedCashRegisters(100, historyDate || undefined);
            setClosedRegisters(closed || []);
        }
        setLoading(false);
    };

    // Refetch history when historyDate changes, but only if there is no active register
    useEffect(() => {
        if (!register && !loading) {
            getClosedCashRegisters(100, historyDate || undefined).then(closed => {
                setClosedRegisters(closed || []);
                setHistoryPage(1);
            });
        }
    }, [historyDate]);

    const handleOpen = async () => {
        const usd = parseFloat(initialUSD);
        const ves = parseFloat(initialVES);
        
        if (isNaN(usd) || isNaN(ves)) return toast.error("Montos inválidos");
        
        const res = await openCashRegister(usd, ves);
        if (res.success) {
            toast.success("Caja Abierta Exitosamente");
            loadData();
        } else {
            toast.error(res.message);
        }
    };

    const handleClose = async () => {
        if (!countedUSD || !countedVES) return toast.error("Debes ingresar lo contado físicamente");
        const usd = parseFloat(countedUSD);
        const ves = parseFloat(countedVES);
        
        if (isNaN(usd) || isNaN(ves)) return toast.error("Montos inválidos");

        setIsClosing(true);
        const res = await closeCashRegister(register.id, usd, ves);
        if (res.success) {
            toast.success("Caja Cerrada. Redirigiendo al Ticket Z...");
            // Redirect to ticket
            router.push(`/dashboard/print/cash-close/${register.id}?format=ticket`);
        } else {
            toast.error(res.message);
            setIsClosing(false);
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-slate-400 font-bold">Cargando estado de caja...</div>;

    if (!register) {
        return (
            <div className="max-w-xl mx-auto mt-10 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
                
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                    <Lock className="text-red-500" size={32} />
                </div>
                
                <h1 className="text-3xl font-black text-slate-900 mb-2">Caja Cerrada</h1>
                <p className="text-slate-500 mb-8">Debes abrir tu turno de caja con un fondo inicial para poder facturar en el Punto de Venta.</p>

                <div className="space-y-6">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Fondo de Caja (Sencillo)</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-2">Efectivo USD ($)</label>
                                <input 
                                    type="number" 
                                    className="w-full text-xl font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-slate-100"
                                    value={initialUSD}
                                    onChange={e => setInitialUSD(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-2">Efectivo Bs</label>
                                <input 
                                    type="number" 
                                    className="w-full text-xl font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-slate-100"
                                    value={initialVES}
                                    onChange={e => setInitialVES(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleOpen}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                    >
                        <Unlock size={20} />
                        Abrir Turno de Caja
                    </button>
                </div>

                {/* History Section when closed */}
                <div className="mt-10 border-t border-slate-100 dark:border-slate-800 pt-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cierres Z Anteriores</h3>
                        <input 
                            type="date" 
                            className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 text-slate-600 dark:text-slate-300 font-bold"
                            value={historyDate}
                            onChange={(e) => setHistoryDate(e.target.value)}
                        />
                    </div>
                    
                    {closedRegisters.length > 0 ? (
                        <div className="space-y-4">
                            <div className="space-y-3">
                                {closedRegisters.slice((historyPage - 1) * 5, historyPage * 5).map((cr: any) => (
                                    <div key={cr.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Cierre: {format(new Date(cr.closed_at), "dd MMM yyyy, h:mm a", { locale: es })}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">ID: {cr.id.split('-')[0]}</p>
                                        </div>
                                        <Link href={`/dashboard/print/cash-close/${cr.id}?format=ticket`}>
                                            <button className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400 transition-colors" title="Ver Ticket">
                                                <Receipt size={18} />
                                            </button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Pagination */}
                            {closedRegisters.length > 5 && (
                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-xs font-bold text-slate-400">
                                        Página {historyPage} de {Math.ceil(closedRegisters.length / 5)}
                                    </span>
                                    <div className="flex gap-2">
                                        <button 
                                            disabled={historyPage === 1}
                                            onClick={() => setHistoryPage(prev => Math.max(prev - 1, 1))}
                                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg font-bold text-xs disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            Anterior
                                        </button>
                                        <button 
                                            disabled={historyPage === Math.ceil(closedRegisters.length / 5)}
                                            onClick={() => setHistoryPage(prev => Math.min(prev + 1, Math.ceil(closedRegisters.length / 5)))}
                                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg font-bold text-xs disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-sm text-slate-400 dark:text-slate-500 font-bold bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-slate-100 dark:border-slate-800/50">
                            No se encontraron cierres en esta fecha.
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Expected in Drawer
    const totalExpectedUSD = Number(register.initial_balance_usd) + (totals?.EFECTIVO_USD || 0);
    const totalExpectedVES = Number(register.initial_balance_ves) + (totals?.EFECTIVO_BS || 0);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl text-emerald-600 dark:text-emerald-400">
                            <Unlock size={28} />
                        </div>
                        Caja Abierta
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Turno iniciado el {format(new Date(register.opened_at), "dd MMM yyyy, h:mm a", { locale: es })}
                    </p>
                </div>
                <Link href="/dashboard/billing/pos">
                    <button className="px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-all flex items-center gap-2">
                        <Terminal size={18} />
                        Ir al Punto de Venta
                    </button>
                </Link>
            </div>

            {/* AUDIT CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="text-emerald-500" size={18} />
                        <span className="text-xs font-bold text-slate-400 uppercase">Efectivo USD</span>
                    </div>
                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100">${(totals?.EFECTIVO_USD || 0).toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <Banknote className="text-slate-500" size={18} />
                        <span className="text-xs font-bold text-slate-400 uppercase">Efectivo Bs</span>
                    </div>
                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100">Bs {(totals?.EFECTIVO_BS || 0).toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <Wallet className="text-purple-500" size={18} />
                        <span className="text-xs font-bold text-slate-400 uppercase">Zelle</span>
                    </div>
                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100">${(totals?.ZELLE || 0).toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="text-blue-500" size={18} />
                        <span className="text-xs font-bold text-slate-400 uppercase">Pago Móvil</span>
                    </div>
                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100">Bs {(totals?.PAGO_MOVIL || 0).toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm col-span-2 md:col-span-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Terminal className="text-orange-500" size={24} />
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase">Punto de Venta (Tarjetas)</span>
                            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">Bs {(totals?.TDD || 0).toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CLOSING SECTION */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl mt-8">
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                    <CheckCircle2 className="text-slate-400" />
                    Ejecutar Cierre Z (Auditoría)
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Expected */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">El Sistema Espera (Fondo + Ventas)</h3>
                        
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                            <span className="font-bold text-slate-600 dark:text-slate-300">Efectivo Físico USD:</span>
                            <span className="text-xl font-black text-slate-900 dark:text-slate-100">${totalExpectedUSD.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-600 dark:text-slate-300">Efectivo Físico Bs:</span>
                            <span className="text-xl font-black text-slate-900 dark:text-slate-100">Bs {totalExpectedVES.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Counted */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Conteo Físico Real en Gaveta</h3>
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Efectivo USD Contado</label>
                            <input 
                                type="number" 
                                className="w-full text-xl font-bold bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-slate-900 dark:text-slate-100"
                                value={countedUSD}
                                onChange={e => setCountedUSD(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Efectivo Bs Contado</label>
                            <input 
                                type="number" 
                                className="w-full text-xl font-bold bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-slate-900 dark:text-slate-100"
                                value={countedVES}
                                onChange={e => setCountedVES(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button 
                        onClick={handleClose}
                        disabled={isClosing}
                        className="px-8 py-4 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-black rounded-xl transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50"
                    >
                        {isClosing ? 'Cerrando Caja...' : 'Confirmar y Cerrar Caja'}
                    </button>
                </div>
            </div>
        </div>
    );
}
