"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, X, ChevronRight, User, UserPlus, Check, Stethoscope, Syringe, Pill, Sparkles, LayoutGrid, ArrowRight, PackageOpen, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { getProducts, searchClients, createQuickClient } from '@/actions/pos-actions';
import { getPendingOrders } from '@/actions/pos-orders';
import { createInvoice } from '@/actions/billing';
import { getCurrentCashRegister } from '@/actions/cash';
import { useRouter } from 'next/navigation';
import { PaymentModal } from './PaymentModal';

interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    category: string;
}

interface CartItem extends Product {
    product_id: string; // For consistency with DB
    quantity: number;
    fromConsultation?: boolean;
    medicalRecordId?: string;
}

interface Client {
    id: string;
    full_name: string;
    identification_doc: string;
}

export function POSWorkspaceThreeColumn({ exchangeRate }: { exchangeRate: number }) {
    const router = useRouter();

    // Core Data
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [client, setClient] = useState<Client | null>(null);
    const [printUrl, setPrintUrl] = useState<string | null>(null);

    // UI State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null); 
    const [isPendingOrdersOpen, setIsPendingOrdersOpen] = useState(false);
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);

    // Search State
    const [globalSearchTerm, setGlobalSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    // Cash Register Logic
    const [cashRegisterId, setCashRegisterId] = useState<string | null>(null);
    const [isRegisterLoading, setIsRegisterLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setIsRegisterLoading(true);
            const res = await getProducts();
            if (res.success) {
                setProducts(res.products || []);
            }
            
            const activeRegister = await getCurrentCashRegister();
            if (activeRegister) {
                setCashRegisterId(activeRegister.id);
            }
            setIsRegisterLoading(false);
        };
        load();
    }, []);

    // Search Logic (Autocomplete)
    useEffect(() => {
        if (!globalSearchTerm) {
            setSearchResults([]);
            return;
        }
        const lower = globalSearchTerm.toLowerCase();
        const results = products.filter(p => p.name.toLowerCase().includes(lower));
        setSearchResults(results.slice(0, 8)); // Limit results
    }, [globalSearchTerm, products]);

    // Drawer Filter Logic
    const drawerProducts = products.filter(p => {
        if (!selectedCategory) return true;
        if (selectedCategory === 'Farmacia') return p.category === 'Medication' || p.category === 'Farmacia';
        if (selectedCategory === 'MedicalService') return p.category === 'MedicalService' || p.category === 'Service' || p.category === 'Consulta';
        return p.category === selectedCategory;
    });

    // Pending Orders Logic
    const fetchPendingOrders = async () => {
        setIsLoadingOrders(true);
        const res = await getPendingOrders();
        if (res.success) setPendingOrders(res.orders || []);
        setIsLoadingOrders(false);
    };

    const loadPendingOrder = (order: any) => {
        if (cart.length > 0) {
            if (!confirm("Esto reemplazará los ítems actuales en el carrito. ¿Deseas continuar?")) return;
        }

        const newCart: CartItem[] = order.items.map((item: any) => ({
            id: item.productId,
            product_id: item.productId,
            name: item.name,
            price: item.unitPrice,
            stock: 100, // Bypass stock check
            category: item.category,
            quantity: item.quantity,
            fromConsultation: item.fromConsultation,
            medicalRecordId: order.medicalRecordId
        }));

        setCart(newCart);
        if (order.client) {
            setClient({
                id: order.client.id,
                full_name: order.client.name,
                identification_doc: order.client.doc
            });
        }
        setIsPendingOrdersOpen(false);
        toast.success("Orden de consulta cargada al carrito");
    };

    // Cart Actions
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product_id === product.id);
            if (existing) {
                return prev.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, product_id: product.id, quantity: 1 }];
        });
        toast.success("Agregado");
        setGlobalSearchTerm(""); // Clear search if used
        setIsSearchFocused(false);
    };

    const updateQty = (id: string, qty: number) => {
        if (qty < 1) return;
        setCart(prev => prev.map(item => item.product_id === id ? { ...item, quantity: qty } : item));
    };

    const removeItem = (id: string) => {
        setCart(prev => prev.filter(item => item.product_id !== id));
    };

    // Client Logic
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [clientQuery, setClientQuery] = useState("");
    const [clientResults, setClientResults] = useState<any[]>([]);
    const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false);

    // Payment Logic
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (clientQuery.length > 2) {
                const res = await searchClients(clientQuery);
                if (res.success) setClientResults(res.clients || []);
            } else {
                setClientResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [clientQuery]);

    async function handleCreateClient(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const res = await createQuickClient(formData);
        if (res.success && res.client) {
            setClient(res.client);
            setIsCreateClientModalOpen(false);
            setIsClientModalOpen(false);
            toast.success("Cliente creado");
        } else {
            toast.error(res.message);
        }
    }

    // Calculations
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    // Categories UI
    const categories = [
        { id: 'MedicalService', label: 'Consultas', icon: <Stethoscope size={20} /> },
        { id: 'Vaccination', label: 'Vacunas', icon: <Syringe size={20} /> },
        { id: 'Farmacia', label: 'Farmacia', icon: <Pill size={20} /> },
        { id: 'Service', label: 'Servicios', icon: <Sparkles size={20} /> },
    ];

    const toggleDrawer = (catId: string | null) => {
        if (selectedCategory === catId && isDrawerOpen) {
            setIsDrawerOpen(false);
            setSelectedCategory(null);
        } else {
            setSelectedCategory(catId);
            setIsDrawerOpen(true);
        }
    };

    // Mobile UI State
    const [mobileTab, setMobileTab] = useState<'catalog' | 'cart' | 'summary'>('catalog');

    // Cash Register Guard
    if (isRegisterLoading) {
        return <div className="h-screen w-full flex items-center justify-center bg-slate-50"><div className="animate-pulse font-bold text-slate-400">Verificando estado de caja...</div></div>;
    }

    if (!cashRegisterId) {
        return (
            <div className="h-[80vh] w-full flex items-center justify-center bg-slate-50">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md text-center border border-red-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="text-red-500" size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Caja Cerrada</h2>
                    <p className="text-slate-500 mb-6">No puedes utilizar el Punto de Venta porque no has abierto tu turno de caja.</p>
                    <button 
                        onClick={() => router.push('/dashboard/billing/cash')}
                        className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                    >
                        Ir a Control de Caja
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row h-full gap-0 overflow-hidden bg-white dark:bg-slate-900 lg:bg-slate-50/50 dark:lg:bg-slate-900/50 lg:rounded-[30px] lg:border lg:border-slate-200/60 dark:lg:border-slate-800 lg:shadow-sm relative">

            {/* --- MOBILE NAVIGATION TABS --- */}
            <div className="lg:hidden flex border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-50">
                {['catalog', 'cart', 'summary'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setMobileTab(tab as any)}
                        className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                            mobileTab === tab ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-slate-400'
                        }`}
                    >
                        {tab === 'catalog' ? 'Catálogo' : tab === 'cart' ? `Factura (${cart.length})` : 'Cliente/Total'}
                    </button>
                ))}
            </div>

            {/* --- LEFT: SIDEBAR (Filters/Drawers) --- */}
            <div className={`${mobileTab === 'catalog' ? 'flex' : 'hidden'} lg:flex w-full lg:w-[90px] bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex-row lg:flex-col items-center py-4 lg:py-8 px-4 lg:px-0 gap-4 lg:gap-6 z-40 relative overflow-x-auto lg:overflow-y-auto custom-scrollbar`}>
                <button
                    onClick={() => toggleDrawer(null)}
                    className={`shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center transition-all ${isDrawerOpen && !selectedCategory ? 'bg-primary text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                    <LayoutGrid size={22} />
                </button>

                <div className="hidden lg:block w-10 h-[1px] bg-slate-100" />
                
                <button
                    onClick={() => {
                        setIsDrawerOpen(false);
                        setSelectedCategory(null);
                        if (!isPendingOrdersOpen) {
                            fetchPendingOrders();
                        }
                        setIsPendingOrdersOpen(!isPendingOrdersOpen);
                    }}
                    className={`shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all relative ${isPendingOrdersOpen ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 shadow-sm' : 'text-slate-300 dark:text-slate-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 dark:hover:text-amber-400 bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800'}`}
                    title="Cuentas Pendientes"
                >
                    <div className="relative">
                        <FileText size={20} />
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse shadow-sm" />
                    </div>
                </button>

                <div className="hidden lg:block w-10 h-[1px] bg-slate-100" />
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => toggleDrawer(cat.id)}
                        className={`shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all relative ${selectedCategory === cat.id && isDrawerOpen ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 shadow-sm' : 'text-slate-300 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        title={cat.label}
                    >
                        {cat.icon}
                    </button>
                ))}
            </div>

            {/* --- DRAWER: CATALOG (Slide out) --- */}
            <AnimatePresence>
                {isDrawerOpen && (
                    <motion.div
                        initial={{ x: -320, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -320, opacity: 0 }}
                        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                        className={`absolute left-0 lg:left-[90px] top-[57px] lg:top-0 bottom-0 w-full lg:w-[320px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-[60] shadow-2xl flex flex-col`}
                    >
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                                {categories.find(c => c.id === selectedCategory)?.label || 'Catálogo General'}
                            </h3>
                            <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-200/50 dark:hover:bg-slate-700 rounded-full text-slate-400">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {drawerProducts.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => { addToCart(product); setIsDrawerOpen(false); }}
                                    className="w-full bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50/10 dark:hover:bg-emerald-900/20 hover:shadow-md transition-all text-left group"
                                >
                                    <p className="font-bold text-slate-700 dark:text-slate-200 leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{product.name}</p>
                                    <div className="flex justify-between items-end mt-2">
                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md uppercase tracking-wide">{product.category}</span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">Bs {(product.price * exchangeRate).toFixed(2)}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- DRAWER: PENDING ORDERS (Slide out) --- */}
            <AnimatePresence>
                {isPendingOrdersOpen && (
                    <motion.div
                        initial={{ x: -320, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -320, opacity: 0 }}
                        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                        className={`absolute left-0 lg:left-[90px] top-[57px] lg:top-0 bottom-0 w-full lg:w-[320px] bg-white border-r border-slate-200 z-[60] shadow-2xl flex flex-col`}
                    >
                        <div className="p-6 border-b border-amber-100 bg-amber-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-amber-800 text-lg">Cuentas por Cobrar</h3>
                            <button onClick={() => setIsPendingOrdersOpen(false)} className="p-2 hover:bg-amber-200/50 rounded-full text-amber-600">
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {isLoadingOrders ? (
                                <div className="text-center p-8 text-amber-400 font-bold text-sm animate-pulse">Buscando órdenes pendientes...</div>
                            ) : pendingOrders.length === 0 ? (
                                <div className="text-center p-8 text-slate-400 font-bold text-sm flex flex-col items-center gap-3">
                                    <Check size={32} className="text-slate-200" />
                                    No hay consultas pendientes de pago.
                                </div>
                            ) : (
                                pendingOrders.map((order, idx) => (
                                    <div key={idx} className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:border-amber-200 hover:shadow-md transition-all">
                                        <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-black text-slate-800 leading-tight">Paciente: {order.petName}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{order.client?.name || 'Sin dueño'}</p>
                                                </div>
                                                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md font-bold">Consulta</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1 italic line-clamp-1">"{order.reason}"</p>
                                        </div>
                                        <div className="p-3 bg-white">
                                            <div className="text-[10px] text-slate-400 mb-2">
                                                {order.items.length} ítems registrados por el {order.vetName}
                                            </div>
                                            <button 
                                                onClick={() => loadPendingOrder(order)}
                                                className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
                                            >
                                                Cargar a Caja
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- CENTER: INVOICE TABLE --- */}
            <div className={`${mobileTab === 'cart' || mobileTab === 'catalog' ? 'flex' : 'hidden'} lg:flex flex-1 flex-col min-w-0 bg-white dark:bg-slate-900 relative z-10 transition-all duration-300`}>
                {/* 1. Autocomplete Search Bar */}
                <div className="h-20 lg:h-28 px-4 lg:px-10 border-b border-border/40 dark:border-slate-800 flex items-center bg-white dark:bg-slate-900 relative z-20">
                    <div className={`w-full flex items-center bg-slate-50/50 dark:bg-slate-800/50 border rounded-full px-5 lg:px-8 py-2.5 lg:py-4 transition-all duration-300 ${isSearchFocused ? 'border-primary/30 ring-4 ring-primary/5 shadow-xl shadow-primary/5 bg-white dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                        <Search className={`mr-3 lg:mr-4 transition-colors ${isSearchFocused ? 'text-primary' : 'text-slate-400'}`} size={18} />
                        <input
                            type="text"
                            className="w-full text-sm lg:text-lg font-medium placeholder:text-slate-300 outline-none text-slate-700 bg-transparent border-none focus:ring-0 p-0"
                            placeholder="Buscar producto..."
                            value={globalSearchTerm}
                            onChange={(e) => setGlobalSearchTerm(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                        />
                    </div>

                    {/* Search Results Dropdown */}
                    <AnimatePresence>
                        {(isSearchFocused || globalSearchTerm.length > 0) && searchResults.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-[70px] lg:top-[90px] left-4 lg:left-10 right-4 lg:right-10 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden max-h-[400px] overflow-y-auto z-50 ring-4 ring-slate-200/50 dark:ring-slate-800/50"
                            >
                                {searchResults.map(match => (
                                    <button
                                        key={match.id}
                                        onClick={() => addToCart(match)}
                                        className="w-full p-4 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center justify-between border-b border-slate-50 dark:border-slate-800 last:border-0 group transition-colors"
                                    >
                                        <div className="text-left">
                                            <p className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-emerald-800 dark:group-hover:text-emerald-400 text-sm lg:text-base">{match.name}</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{match.category}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 text-sm lg:text-base">Bs {(match.price * exchangeRate).toFixed(2)}</p>
                                        </div>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 2. Detailed Invoice Table */}
                <div className={`flex-1 overflow-auto bg-slate-50/30 dark:bg-slate-900/50 p-4 lg:p-8 custom-scrollbar ${mobileTab === 'catalog' ? 'hidden lg:block' : ''}`}>
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 select-none pointer-events-none">
                            <div className="w-24 h-24 lg:w-32 lg:h-32 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                                <PackageOpen size={32} className="lg:size-48 text-slate-400" />
                            </div>
                            <h2 className="text-xl lg:text-2xl font-bold text-slate-300 text-center">Factura Vacía</h2>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-[24px] lg:rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 overflow-hidden">
                            {/* MOBILE LIST VIEW */}
                            <div className="lg:hidden divide-y divide-slate-100">
                                {cart.map(item => (
                                    <div key={item.id} className="p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-tight">{item.category}</p>
                                            </div>
                                            <button onClick={() => removeItem(item.product_id)} className="text-slate-300"><X size={16} /></button>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center bg-slate-50 border border-slate-100 rounded-lg h-8">
                                                <button onClick={() => updateQty(item.product_id, item.quantity - 1)} className="w-8 h-full flex items-center justify-center text-slate-400">-</button>
                                                <span className="px-2 text-sm font-bold text-slate-900">{item.quantity}</span>
                                                <button onClick={() => updateQty(item.product_id, item.quantity + 1)} className="w-8 h-full flex items-center justify-center text-slate-400">+</button>
                                            </div>
                                            <p className="font-bold text-emerald-600 text-sm">Bs {((item.price * exchangeRate) * item.quantity).toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* DESKTOP TABLE VIEW */}
                            <table className="hidden lg:table w-full">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción</th>
                                        <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 w-[140px]">Cantidad</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 w-[140px]">P. Unit</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 w-[140px]">Total</th>
                                        <th className="px-6 py-4 w-[60px]"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {cart.map(item => (
                                        <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{item.name}</p>
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500">{item.category}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg w-fit mx-auto">
                                                    <button onClick={() => updateQty(item.product_id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-slate-400">-</button>
                                                    <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                                                    <button onClick={() => updateQty(item.product_id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-slate-400">+</button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="font-bold text-slate-700 dark:text-slate-300">Bs {(item.price * exchangeRate).toFixed(2)}</p>
                                            </td>
                                            <td className="px-6 py-4 text-right bg-slate-50/30 dark:bg-slate-800/30">
                                                <p className="font-bold text-emerald-600">Bs {((item.price * exchangeRate) * item.quantity).toFixed(2)}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => removeItem(item.product_id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* --- RIGHT: SUMMARY & CLIENT --- */}
            <div className={`${mobileTab === 'summary' ? 'flex' : 'hidden'} lg:flex w-full lg:w-[340px] bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 flex-col z-20 shadow-xl lg:shadow-none`}>
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">Cliente / Propietario</span>
                    {client ? (
                        <div className="relative p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold border border-white dark:border-slate-700">{client.full_name.charAt(0)}</div>
                                <div className="overflow-hidden">
                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{client.full_name}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{client.identification_doc}</p>
                                </div>
                            </div>
                            <button onClick={() => setClient(null)} className="absolute top-2 right-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all"><X size={12} /></button>
                        </div>
                    ) : (
                        <button onClick={() => setIsClientModalOpen(true)} className="w-full py-4 border border-dashed border-slate-300 rounded-2xl text-slate-400 font-bold text-sm hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2">
                            <UserPlus size={18} /> Asignar Cliente
                        </button>
                    )}
                </div>

                <div className="mt-auto p-6 lg:p-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-widest">
                            <span>Total Bruto</span>
                            <span>Bs {(subtotal * exchangeRate).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-end border-t border-slate-100 pt-4">
                            <div>
                                <span className="text-slate-900 text-[10px] font-black uppercase tracking-widest">Total a Pagar</span>
                                <p className="text-[10px] text-emerald-500 font-bold mt-0.5">Ref: ${total.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-slate-900 tracking-tight">Bs {(total * exchangeRate).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsPaymentModalOpen(true)}
                        disabled={cart.length === 0 || !client}
                        className="w-full py-5 bg-slate-900 hover:bg-emerald-600 disabled:bg-slate-100 disabled:text-slate-300 text-white font-black text-base rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
                    >
                        Procesar Pago <ArrowRight size={18} />
                    </button>
                </div>
            </div>

            {/* --- MODALS --- */}
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                totalUSD={total}
                exchangeRate={exchangeRate}
                items={cart.map(i => ({ productId: i.product_id, name: i.name, quantity: i.quantity, unitPrice: i.price, fromConsultation: i.fromConsultation }))}
                medicalRecordId={cart.find(item => item.medicalRecordId)?.medicalRecordId}
                cashRegisterId={cashRegisterId || ""}
                onSuccess={(invoiceId) => {
                    toast.success("Factura pagada con éxito");
                    setCart([]);
                    setClient(null);
                    setIsPaymentModalOpen(false);
                    if (invoiceId) {
                        setPrintUrl(`/dashboard/print/invoice/${invoiceId}?format=ticket`);
                    }
                }}
            />


            {/* Hidden Print Frame */}
            <iframe src={printUrl || undefined} className="hidden" />

            <AnimatePresence>
                {isClientModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsClientModalOpen(false)} className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden z-10 border border-slate-100 dark:border-slate-800 ring-4 ring-slate-200/50 dark:ring-slate-800/50">
                            <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
                                <div className="flex justify-between items-center gap-4">
                                    <div className="relative flex-1 group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500 group-focus-within:text-primary transition-colors" size={20} />
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Buscar cliente por CI o Nombre..."
                                            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary/30 outline-none transition-all font-bold text-slate-800 dark:text-slate-100 text-lg placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm"
                                            value={clientQuery}
                                            onChange={(e) => setClientQuery(e.target.value)}
                                        />
                                    </div>
                                    <button onClick={() => setIsClientModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={20} /></button>
                                </div>
                            </div>
                            <div className="max-h-[350px] overflow-y-auto p-4 space-y-2 custom-scrollbar">
                                {clientResults.length === 0 && clientQuery.length > 2 && (
                                    <div className="text-center py-8 text-slate-400">
                                        <p>No se encontraron clientes</p>
                                    </div>
                                )}
                                {clientResults.map(c => (
                                    <button key={c.id} onClick={() => { setClient(c); setIsClientModalOpen(false); }} className="w-full p-4 flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-transparent hover:border-emerald-100 dark:hover:border-emerald-800 rounded-2xl transition-all text-left group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 font-bold text-sm shadow-sm">{c.full_name.charAt(0)}</div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-slate-200 text-base group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{c.full_name}</p>
                                                <p className="text-xs text-slate-400 uppercase tracking-wide group-hover:text-emerald-500/70">{c.identification_doc}</p>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                                            <Check className="text-emerald-500" size={16} strokeWidth={3} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Quick Create Client Modal */}
            <AnimatePresence>
                {isCreateClientModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateClientModalOpen(false)} className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]" />
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-xl z-20 overflow-hidden border border-slate-100 dark:border-slate-800">
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
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    );
}
