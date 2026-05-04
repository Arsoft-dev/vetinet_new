"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Plus, Trash2, UserPlus, CreditCard, Banknote, History, ArrowLeft, ShoppingCart, Percent, User, X, Check, Save, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getProducts } from "@/actions/inventory";
import { searchClients } from "@/actions/search-clients";
import { createQuickClient } from "@/actions/pos-actions";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface POSItem {
    id: string;
    product_id: string;
    name: string;
    quantity: number;
    price: number;
    tax_percent: number;
    category: string;
}

export function POSWorkspace({ exchangeRate }: { exchangeRate: number }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [cart, setCart] = useState<POSItem[]>([]);
    const [client, setClient] = useState<any | null>(null);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false);
    const [clientQuery, setClientQuery] = useState("");
    const [clientResults, setClientResults] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Refs for clicking outside
    const searchRef = useRef<HTMLDivElement>(null);

    // Close search results on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setSearchResults([]);
                setSearchTerm("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Search products
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchTerm.length >= 2 || selectedCategory) {
                const results = await getProducts(searchTerm);
                const filtered = selectedCategory
                    ? results.filter((p: any) => p.category === selectedCategory || (selectedCategory === 'Farmacia' && p.category === 'Medication'))
                    : results;
                setSearchResults(filtered);
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, selectedCategory]);

    // Search clients
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (clientQuery.length >= 2) {
                const results = await searchClients(clientQuery);
                setClientResults(results);
            } else {
                setClientResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [clientQuery]);

    const addToCart = (product: any) => {
        const existing = cart.find(i => i.product_id === product.id);
        if (existing) {
            updateQty(product.id, existing.quantity + 1);
        } else {
            setCart([...cart, {
                id: crypto.randomUUID(),
                product_id: product.id,
                name: product.name,
                quantity: 1,
                price: product.sale_price,
                tax_percent: product.category === 'Service' || product.category === 'Consulta' ? 0 : 16,
                category: product.category
            }]);
        }
        setSearchTerm("");
        setSearchResults([]);
    };

    const updateQty = (id: string, qty: any) => {
        const numQty = parseFloat(qty);
        if (numQty <= 0) return;
        setCart(prev => prev.map(item => item.product_id === id ? { ...item, quantity: numQty } : item));
    };

    const removeItem = (id: string) => {
        setCart(prev => prev.filter(item => item.product_id !== id));
    };

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const iva = cart.reduce((acc, item) => acc + (item.price * item.quantity * (item.tax_percent / 100)), 0);
    const total = subtotal + iva;

    const categories = [
        { id: 'Consulta', label: 'Consultas', icon: '🩺' },
        { id: 'Vacuna', label: 'Vacunas', icon: '💉' },
        { id: 'Farmacia', label: 'Farmacia', icon: '💊' },
        { id: 'Service', label: 'Servicios', icon: '✨' },
    ];

    const handleCreateClient = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const res = await createQuickClient(formData);
        if (res.success) {
            setClient(res.client);
            setIsCreateClientModalOpen(false);
            toast.success("Cliente registrado con éxito");
        } else {
            toast.error(res.message);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">

            {/* Left Side: Product Selection */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden min-h-0">
                <div className="relative" ref={searchRef}>
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input
                        type="text"
                        placeholder="¿Qué medicamento o servicio buscas?"
                        className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-3xl shadow-sm focus:ring-4 focus:ring-primary/5 focus:border-primary/30 outline-none transition-all text-base font-medium placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <AnimatePresence>
                        {searchResults.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 max-h-[60vh] overflow-y-auto p-2"
                            >
                                {searchResults.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => addToCart(p)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                                                {p.category === 'Service' ? '✨' : (p.category === 'Medication' || p.category === 'Farmacia') ? '💊' : '🔬'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{p.name}</p>
                                                <p className="text-xs text-emerald-600 font-bold">Bs {(p.sale_price * exchangeRate).toFixed(2)}</p>
                                                <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">${p.sale_price} USD • {p.totalStock} {p.unit}</p>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-slate-50 rounded-full text-slate-300 flex items-center justify-center">
                                            <Plus size={18} />
                                        </div>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Categories Grid - Functional Filters */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-shrink-0">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                            className={cn(
                                "p-4 rounded-3xl border transition-all flex flex-col items-center gap-2 group",
                                selectedCategory === cat.id
                                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-500'
                            )}
                        >
                            <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                            <p className="text-[10px] font-black uppercase tracking-[0.15em]">{cat.label}</p>
                        </button>
                    ))}
                </div>

                {/* Interactive Empty State */}
                {!selectedCategory && cart.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-200 py-12">
                        <div className="w-40 h-40 bg-slate-50/50 rounded-full flex items-center justify-center mb-8 border border-white">
                            <ShoppingCart size={80} strokeWidth={1} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-400 tracking-tight">Selecciona productos para comenzar</h3>
                        <p className="text-sm text-slate-300 mt-2 font-medium">Buscando en inventario en tiempo real</p>
                    </div>
                )}

                {/* Grid of items when category is selected */}
                <AnimatePresence mode="wait">
                    {selectedCategory && (
                        <motion.div
                            key={selectedCategory}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-12">
                                {searchResults.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => addToCart(p)}
                                        className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-xl hover:border-primary/20 transition-all text-left flex justify-between items-center group overflow-hidden"
                                    >
                                        <div className="min-w-0 pr-4">
                                            <p className="font-bold text-slate-800 truncate text-base">{p.name}</p>
                                            <div className="flex flex-col mt-2">
                                                <span className="text-emerald-600 font-bold text-lg leading-tight">Bs {(p.sale_price * exchangeRate).toFixed(2)}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">${p.sale_price} USD</span>
                                            </div>
                                        </div>
                                        <div className="w-11 h-11 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all transform group-active:scale-95 shadow-sm text-slate-400">
                                            <Plus size={20} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Right Side: Cart Summary - DELICATE DESIGN */}
            <div className="w-full lg:w-[420px] flex flex-col bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden flex-shrink-0 min-h-0 max-h-full">

                {/* Header / Client */}
                <div className="p-7 border-b border-slate-50 bg-slate-50/30 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <User size={14} className="text-slate-300" />
                            Cliente Receptor
                        </h3>
                        <button
                            onClick={() => setIsCreateClientModalOpen(true)}
                            className="text-[10px] font-bold text-primary px-3 py-1 bg-white border border-slate-200 rounded-full hover:bg-slate-50 shadow-sm transition-all"
                        >
                            NUEVO
                        </button>
                    </div>
                    {client ? (
                        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center font-bold">
                                    {client.full_name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-slate-800 leading-tight">{client.full_name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-widest">{client.identification_doc || "S/N"}</p>
                                </div>
                            </div>
                            <button onClick={() => setClient(null)} className="p-2 text-slate-200 hover:text-red-400 transition-colors">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsClientModalOpen(true)}
                            className="w-full py-4 px-6 border border-dashed border-slate-300 rounded-2xl text-slate-400 font-bold text-sm hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-3 bg-white/50"
                        >
                            <UserPlus size={18} />
                            Seleccionar Cliente
                        </button>
                    )}
                </div>

                {/* Items Area */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[150px] custom-scrollbar">
                    {cart.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 text-slate-300 gap-4 py-8">
                            <ShoppingCart size={32} />
                            <p className="text-[10px] font-black uppercase tracking-widest">Resumen vacío</p>
                        </div>
                    )}
                    <AnimatePresence>
                        {cart.map(item => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex items-center justify-between group"
                            >
                                <div className="flex-1 pr-4">
                                    <p className="font-bold text-sm text-slate-700 leading-snug">{item.name}</p>
                                    <p className="text-xs text-emerald-600 font-bold mt-1">Bs {((item.price * exchangeRate) * item.quantity).toFixed(2)}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl p-1">
                                        <button onClick={() => updateQty(item.product_id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-900">-</button>
                                        <span className="w-8 text-center text-xs font-bold text-slate-900">{item.quantity}</span>
                                        <button onClick={() => updateQty(item.product_id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-900">+</button>
                                    </div>
                                    <button onClick={() => removeItem(item.product_id)} className="p-1.5 text-slate-200 hover:text-red-400 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Totals Area - COMPACT & VISIBLE */}
                <div className="mt-auto p-6 pt-6 border-t border-slate-100 bg-slate-50/5 flex-shrink-0">
                    <div className="space-y-2 mb-6">
                        <div className="flex justify-between items-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                            <span>Subtotal Base</span>
                            <div className="text-right">
                                <p className="text-slate-800 font-bold text-sm">Bs {(subtotal * exchangeRate).toFixed(2)}</p>
                                <p className="opacity-50 text-[10px] tabular-nums">${subtotal.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                            <span>Impuestos (IVA 16%)</span>
                            <div className="text-right">
                                <p className="text-slate-800 font-bold text-sm">Bs {(iva * exchangeRate).toFixed(2)}</p>
                                <p className="opacity-50 text-[10px] tabular-nums">${iva.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-start mb-6 pt-4 border-t border-slate-100/50">
                        <div className="pt-1">
                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Total Facturado</p>
                            <div className="hidden lg:block mt-2 opacity-30">
                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Tasa: {exchangeRate.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-baseline justify-end gap-1">
                                <span className="text-lg font-bold text-slate-900/40 italic">Bs</span>
                                <span className="text-4xl font-bold text-slate-900 tracking-tighter leading-none">{(total * exchangeRate).toFixed(2)}</span>
                            </div>
                            <p className="text-[11px] font-bold text-emerald-600 mt-1 uppercase tracking-widest tabular-nums">REF: ${total.toFixed(2)} USD</p>
                        </div>
                    </div>

                    <button
                        disabled={cart.length === 0 || !client}
                        className="w-full py-4 bg-primary hover:bg-primary-dark disabled:bg-slate-100 disabled:text-slate-300 text-white font-bold text-base rounded-[20px] shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] group"
                    >
                        Procesar Factura
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>

                    <div className="h-4"></div>
                </div>
            </div>

            {/* Modal: Client Selector */}
            <AnimatePresence>
                {isClientModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsClientModalOpen(false)} className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden z-10 border border-slate-100">
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Seleccionar Cliente</h2>
                                    <button onClick={() => setIsClientModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-300"><X size={20} /></button>
                                </div>
                                <div className="relative mb-6">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input autoFocus type="text" placeholder="Busca por nombre o CI..." className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-primary/10 outline-none transition-all font-medium text-slate-900" value={clientQuery} onChange={(e) => setClientQuery(e.target.value)} />
                                </div>
                                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {clientResults.map(c => (
                                        <button key={c.id} onClick={() => { setClient(c); setIsClientModalOpen(false); }} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 rounded-2xl transition-all text-left group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-bold group-hover:bg-primary/10 group-hover:text-primary transition-colors">{c.full_name.charAt(0)}</div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{c.full_name}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">{c.identification_doc || "CI Desconocida"}</p>
                                                </div>
                                            </div>
                                            <Check className="text-primary opacity-0 group-hover:opacity-100" size={18} />
                                        </button>
                                    ))}
                                    {clientQuery.length >= 2 && clientResults.length === 0 && (
                                        <div className="text-center py-10 opacity-50 flex flex-col items-center gap-3">
                                            <User size={32} strokeWidth={1} />
                                            <p className="text-sm font-medium">No hay resultados. Crea uno nuevo.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Quick Create Client */}
            <AnimatePresence>
                {isCreateClientModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateClientModalOpen(false)} className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]" />
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-white w-full max-w-md rounded-3xl shadow-xl z-20 overflow-hidden border border-slate-100">
                            <form onSubmit={handleCreateClient} className="p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Nueva Identidad</h2>
                                    <button type="button" onClick={() => setIsCreateClientModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-300"><X size={20} /></button>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Nombre y Apellido</label>
                                        <input required name="name" type="text" className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all font-medium text-slate-800" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Identificación</label>
                                            <input required name="doc" type="text" placeholder="V-000000" className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all font-medium text-slate-800" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Móvil</label>
                                            <input name="phone" type="tel" className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all font-medium text-slate-800" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Correo (Opcional)</label>
                                        <input name="email" type="email" className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all font-medium text-slate-800" />
                                    </div>
                                </div>

                                <button type="submit" className="w-full mt-10 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all text-sm">
                                    Registrar y Seleccionar
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e2e8f0; }
            `}</style>
        </div>
    );
}
