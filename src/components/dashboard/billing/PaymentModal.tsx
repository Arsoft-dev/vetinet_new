"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, DollarSign, Wallet, CreditCard, Banknote, ArrowRight, CheckCircle2, Terminal } from "lucide-react";
import { toast } from "sonner";
import { createInvoice } from "@/actions/billing";
import { Drawer } from "vaul";
import { useMediaQuery } from "@/hooks/use-media-query";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    totalUSD: number;
    exchangeRate: number;
    clientId: string;
    items: any[];
    cashRegisterId: string;
    medicalRecordId?: string;
    onSuccess: (invoiceId?: string) => void;
}

type PaymentMethod = 'EFECTIVO_USD' | 'EFECTIVO_BS' | 'ZELLE' | 'PAGO_MOVIL' | 'TDD';

interface PaymentDetail {
    method: PaymentMethod;
    amount: number; // in the currency of the method
    reference?: string;
}

export function PaymentModal({ isOpen, onClose, totalUSD, exchangeRate, clientId, items, cashRegisterId, medicalRecordId, onSuccess }: PaymentModalProps) {
    // 1. Calculate Base Breakdown (assuming items passed have price without IVA, or we estimate from totalUSD)
    // To be perfectly accurate, we should pass subtotal, exempt, taxable from POSWorkspace.
    // Since POSWorkspace currently just does: subtotal = sum(price*qty), iva = subtotal * 0.16.
    // We will recompute it here from items for strict fidelity.
    const computedSubtotal = items.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);
    const computedIva = computedSubtotal * 0.16;

    const [payments, setPayments] = useState<PaymentDetail[]>([]);
    const [currentMethod, setCurrentMethod] = useState<PaymentMethod | null>(null);
    const [amountInput, setAmountInput] = useState("");
    const [referenceInput, setReferenceInput] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    
    const isDesktop = useMediaQuery("(min-width: 1024px)");

    const [changePayments, setChangePayments] = useState<PaymentDetail[]>([]);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setPayments([]);
            setChangePayments([]);
            setCurrentMethod(null);
            setAmountInput("");
            setReferenceInput("");
        }
    }, [isOpen]);

    // Calculate Totals
    const totalBS = totalUSD * exchangeRate;

    // Calculate IGTF (3% over foreign currency payments)
    // To avoid infinite fraction loops (where adding IGTF increases the total, requiring more IGTF),
    // we extract the base of the foreign payment by dividing by 1.03.
    const foreignPaymentsUSD = payments.reduce((acc, p) => {
        if (p.method === 'EFECTIVO_USD' || p.method === 'ZELLE') {
            return acc + p.amount; // amount is in USD
        }
        return acc;
    }, 0);

    const igtfUSD = (foreignPaymentsUSD / 1.03) * 0.03;
    const grandTotalUSD = computedSubtotal + computedIva + igtfUSD;
    const grandTotalBS = grandTotalUSD * exchangeRate;

    // Calculate Paid so far (normalized to USD)
    const totalPaidUSD = payments.reduce((acc, p) => {
        if (p.method === 'EFECTIVO_BS' || p.method === 'PAGO_MOVIL' || p.method === 'TDD') {
            return acc + (p.amount / exchangeRate);
        }
        return acc + p.amount;
    }, 0);

    const remainingUSD = Math.max(0, grandTotalUSD - totalPaidUSD);
    const remainingBS = remainingUSD * exchangeRate;
    const changeUSD = Math.max(0, totalPaidUSD - grandTotalUSD);
    const changeBS = changeUSD * exchangeRate;

    const isFullyPaid = totalPaidUSD >= grandTotalUSD - 0.01; // tolerance

    // Change Management
    const totalChangeReturnedUSD = changePayments.reduce((acc, p) => {
        if (p.method === 'EFECTIVO_BS' || p.method === 'PAGO_MOVIL' || p.method === 'TDD') {
            return acc + (p.amount / exchangeRate);
        }
        return acc + p.amount;
    }, 0);

    const pendingChangeUSD = Math.max(0, changeUSD - totalChangeReturnedUSD);
    const pendingChangeBS = pendingChangeUSD * exchangeRate;
    const isChangeFullyReturned = changeUSD <= 0.01 || pendingChangeUSD <= 0.01;

    const isVueltoMode = isFullyPaid && changeUSD > 0.01;

    const handleAddPayment = () => {
        if (!currentMethod) return;
        const val = parseFloat(amountInput);
        if (isNaN(val) || val <= 0) return toast.error("Monto inválido");

        if (isVueltoMode) {
            setChangePayments([...changePayments, { method: currentMethod, amount: val, reference: referenceInput || "VUELTO" }]);
        } else {
            setPayments([...payments, { method: currentMethod, amount: val, reference: referenceInput }]);
        }
        
        setAmountInput("");
        setReferenceInput("");
        setCurrentMethod(null);
    };

    const handleProcessPayment = async () => {
        if (!isFullyPaid) return toast.error("Falta cubrir el monto total");
        if (isVueltoMode && !isChangeFullyReturned) return toast.error("Falta repartir el vuelto");
        setIsProcessing(true);

        // Prepare final payments array (outgoing change is negative)
        const finalPayments = [
            ...payments,
            ...changePayments.map(p => ({ ...p, amount: -p.amount }))
        ];
        // For now, createInvoice just marks as paid.
        // TODO: Update createInvoice to accept payment details

        const res = await createInvoice({
            clientId,
            items,
            totalUSD: grandTotalUSD, // Save the final amount with IGTF
            exchangeRate,
            taxes: {
                subtotal: computedSubtotal,
                exemptAmount: 0, // Currently treating everything as taxable
                taxableAmount: computedSubtotal,
                ivaAmount: computedIva,
                igtfAmount: igtfUSD
            },
            payments: finalPayments,
            cashRegisterId,
            medicalRecordId
        });

        setIsProcessing(false);

        if (res.success) {
            toast.success("Factura Creada Exitosamente - Imprimiendo Ticket...");

            onSuccess(res.invoice?.id);
            onClose();
        } else {
            toast.error(res.message);
        }
    };

    if (!isOpen) return null;

    const ModalContent = (
        <>
            {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Procesar Pago</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Seleccione los métodos de pago para completar la venta</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total a Pagar {igtfUSD > 0 && <span className="text-purple-500">(+IGTF)</span>}</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-slate-100">Bs {grandTotalBS.toFixed(2)}</p>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Ref: ${grandTotalUSD.toFixed(2)}</p>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 py-3 px-4 lg:px-6 flex items-center justify-between text-xs overflow-x-auto custom-scrollbar">
                    <div className="flex gap-4 lg:gap-6 min-w-max">
                        <span className="text-slate-500 dark:text-slate-400">Base Imponible: <span className="font-bold text-slate-700 dark:text-slate-300">${computedSubtotal.toFixed(2)}</span></span>
                        <span className="text-slate-500 dark:text-slate-400">IVA (16%): <span className="font-bold text-slate-700 dark:text-slate-300">${computedIva.toFixed(2)}</span></span>
                        {igtfUSD > 0 && <span className="text-purple-600 font-bold bg-purple-100 px-2 py-0.5 rounded-full animate-pulse">IGTF (3%): ${igtfUSD.toFixed(2)}</span>}
                    </div>
                </div>

                <div className="flex-1 overflow-auto lg:overflow-hidden flex flex-col lg:flex-row">
                    {/* LEFT: Payment Methods */}
                    <div className="w-full lg:w-1/2 p-4 lg:p-6 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 overflow-visible lg:overflow-y-auto custom-scrollbar bg-white dark:bg-slate-950">
                        <h3 className={`text-xs font-black uppercase tracking-widest mb-4 ${isVueltoMode ? 'text-amber-500' : 'text-slate-400'}`}>
                            {isVueltoMode ? 'Registrar Salida de Vuelto' : 'Agregar Método de Pago'}
                        </h3>

                        {!currentMethod ? (
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setCurrentMethod('EFECTIVO_USD')} className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:shadow-md transition-all text-left group">
                                    <DollarSign className="text-emerald-600 dark:text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="font-bold text-emerald-900 dark:text-emerald-100 block">Efectivo USD</span>
                                    <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Divisa billete</span>
                                </button>
                                <button onClick={() => setCurrentMethod('EFECTIVO_BS')} className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 hover:shadow-md transition-all text-left group">
                                    <Banknote className="text-slate-600 dark:text-slate-400 mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="font-bold text-slate-900 dark:text-slate-100 block">Efectivo Bs</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Bolívares Físico</span>
                                </button>
                                <button onClick={() => setCurrentMethod('ZELLE')} className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/50 rounded-2xl hover:bg-purple-100 dark:hover:bg-purple-900/40 hover:shadow-md transition-all text-left group">
                                    <Wallet className="text-purple-600 dark:text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="font-bold text-purple-900 dark:text-purple-100 block">Zelle</span>
                                    <span className="text-xs text-purple-600/70 dark:text-purple-400/70">Transferencia digital</span>
                                </button>
                                <button onClick={() => setCurrentMethod('PAGO_MOVIL')} className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:shadow-md transition-all text-left group">
                                    <CreditCard className="text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="font-bold text-blue-900 dark:text-blue-100 block">Pago Móvil</span>
                                    <span className="text-xs text-blue-600/70 dark:text-blue-400/70">Transferencia Bs</span>
                                </button>
                                <button onClick={() => setCurrentMethod('TDD')} className="col-span-2 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/50 rounded-2xl hover:bg-orange-100 dark:hover:bg-orange-900/40 hover:shadow-md transition-all text-left group flex items-center gap-4">
                                    <div className="bg-orange-100 dark:bg-orange-900/50 p-3 rounded-xl group-hover:bg-orange-200 dark:group-hover:bg-orange-800 transition-colors">
                                        <Terminal className="text-orange-600 dark:text-orange-400" size={28} />
                                    </div>
                                    <div>
                                        <span className="font-bold text-orange-900 dark:text-orange-100 block text-lg">Punto de Venta</span>
                                        <span className="text-xs text-orange-600/70 dark:text-orange-400/70">Tarjeta de Débito (Bs)</span>
                                    </div>
                                </button>
                            </div>
                        ) : (
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                        {currentMethod === 'EFECTIVO_USD' && <DollarSign size={18} className="text-emerald-600 dark:text-emerald-400" />}
                                        {currentMethod === 'ZELLE' && <Wallet size={18} className="text-purple-600 dark:text-purple-400" />}
                                        Agregando: {currentMethod.replace('_', ' ')}
                                    </h4>
                                    <button onClick={() => setCurrentMethod(null)} className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded-full"><X size={18} className="text-slate-400" /></button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Monto a abonar</label>
                                        <div className="mt-1 relative">
                                            <input
                                                autoFocus
                                                type="number"
                                                className="w-full text-2xl font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-primary/10 transition-all dark:text-slate-100"
                                                placeholder="0.00"
                                                value={amountInput}
                                                onChange={e => setAmountInput(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleAddPayment()}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                                                {['EFECTIVO_BS', 'PAGO_MOVIL', 'TDD'].includes(currentMethod) ? 'Bs' : '$'}
                                            </span>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            {['EFECTIVO_BS', 'PAGO_MOVIL', 'TDD'].includes(currentMethod) ? (
                                                <button 
                                                    onClick={() => setAmountInput(isVueltoMode ? pendingChangeBS.toFixed(2) : remainingBS.toFixed(2))} 
                                                    className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                                                >
                                                    {isVueltoMode ? `Devolver Bs ${pendingChangeBS.toFixed(2)}` : `Pagar Restante (Bs ${remainingBS.toFixed(2)})`}
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => {
                                                        const suggested = isVueltoMode ? pendingChangeUSD : (remainingUSD * 1.03);
                                                        setAmountInput(suggested.toFixed(2));
                                                    }} 
                                                    className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                                                >
                                                    {isVueltoMode ? `Devolver $${pendingChangeUSD.toFixed(2)}` : `Pagar Restante ($${(remainingUSD * 1.03).toFixed(2)})`}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {(currentMethod === 'ZELLE' || currentMethod === 'PAGO_MOVIL' || currentMethod === 'TDD') && (
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Referencia / # Recibo</label>
                                            <input
                                                type="text"
                                                className="w-full mt-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium dark:text-slate-100"
                                                placeholder="Ej. 123456"
                                                value={referenceInput}
                                                onChange={e => setReferenceInput(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleAddPayment()}
                                            />
                                        </div>
                                    )}

                                    <button onClick={handleAddPayment} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl mt-2 hover:bg-slate-800 transition-colors">
                                        Agregar Pago
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Breakdowns */}
                    <div className="w-full lg:w-1/2 p-4 lg:p-6 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col overflow-visible lg:overflow-y-auto custom-scrollbar">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Pagos Registrados</h3>

                        <div className="flex-1 overflow-y-auto space-y-2 mb-4 custom-scrollbar">
                            {payments.length === 0 ? (
                                <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-sm font-medium">
                                    No hay pagos registrados aún
                                </div>
                            ) : (
                                payments.map((p, idx) => (
                                    <div key={idx} className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                                                {p.method.includes('USD') || p.method === 'ZELLE' ? <DollarSign size={14} className="text-slate-600 dark:text-slate-400" /> : <span className="text-xs font-black text-slate-600 dark:text-slate-400">Bs</span>}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{p.method.replace('_', ' ')}</p>
                                                {p.reference && <p className="text-[10px] text-slate-400">Ref: {p.reference}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-slate-900 dark:text-slate-100">
                                                {['EFECTIVO_BS', 'PAGO_MOVIL', 'TDD'].includes(p.method) ? `Bs ${p.amount.toFixed(2)}` : `$${p.amount.toFixed(2)}`}
                                            </span>
                                            <button onClick={() => setPayments(prev => prev.filter((_, i) => i !== idx))} className="text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors"><X size={14} /></button>
                                        </div>
                                    </div>
                                ))
                            )}

                            {/* Change Payments List */}
                            {changePayments.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                                    <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Vueltos Registrados</h4>
                                    {changePayments.map((p, idx) => (
                                        <div key={`change-${idx}`} className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 flex justify-between items-center shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center">
                                                    {p.method.includes('USD') || p.method === 'ZELLE' ? <DollarSign size={14} className="text-amber-600 dark:text-amber-500" /> : <span className="text-xs font-black text-amber-600 dark:text-amber-500">Bs</span>}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-amber-900 dark:text-amber-100 text-sm">{p.method.replace('_', ' ')}</p>
                                                    <p className="text-[10px] text-amber-600 dark:text-amber-500">Ref: VUELTO</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-amber-900 dark:text-amber-100">
                                                    {['EFECTIVO_BS', 'PAGO_MOVIL', 'TDD'].includes(p.method) ? `-Bs ${p.amount.toFixed(2)}` : `-$${p.amount.toFixed(2)}`}
                                                </span>
                                                <button onClick={() => setChangePayments(prev => prev.filter((_, i) => i !== idx))} className="text-amber-300 dark:text-amber-700 hover:text-red-500 transition-colors"><X size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Calculations Box */}
                        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 dark:text-slate-400 font-medium">Total Pagado ($)</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">${totalPaidUSD.toFixed(2)}</span>
                            </div>

                            {!isFullyPaid ? (
                                <div className="flex justify-between items-center text-sm p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-200">
                                    <span className="font-bold">Restante por pagar</span>
                                    <div className="text-right">
                                        <p className="font-bold text-lg">${remainingUSD.toFixed(2)}</p>
                                        <p className="text-xs opacity-75">Bs {remainingBS.toFixed(2)}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className={`flex justify-between items-center text-sm p-3 rounded-xl border ${isChangeFullyReturned ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-200' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-200'}`}>
                                    <span className="font-bold">{isChangeFullyReturned ? 'Vuelto Repartido' : 'Falta Repartir Vuelto'}</span>
                                    <div className="text-right">
                                        <p className="font-bold text-lg">${pendingChangeUSD.toFixed(2)}</p>
                                        <p className="text-xs opacity-75">Bs {pendingChangeBS.toFixed(2)}</p>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleProcessPayment}
                                disabled={!isFullyPaid || (isVueltoMode && !isChangeFullyReturned) || isProcessing}
                                className="w-full py-4 mt-2 bg-slate-900 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-base rounded-xl transition-all shadow-lg shadow-slate-900/10 hover:shadow-emerald-500/30 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? 'Procesando...' : (
                                    <>
                                        <CheckCircle2 size={20} />
                                        Finalizar Venta
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
        </>
    );

    if (isDesktop) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
                >
                    {ModalContent}
                </motion.div>
            </div>
        );
    }

    return (
        <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[200]" />
                <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[24px] mt-10 fixed bottom-0 left-0 right-0 z-[210] focus:outline-none max-h-[96vh]">
                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 my-3" />
                    <Drawer.Title className="sr-only">Procesar Pago</Drawer.Title>
                    <Drawer.Description className="sr-only">Formulario para procesar un pago.</Drawer.Description>
                    <div className="flex-1 overflow-y-auto">
                        {ModalContent}
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
