"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Trash2, Package, Pill } from "lucide-react";
import { getProducts } from "@/actions/inventory";
import { motion, AnimatePresence } from "framer-motion";

interface InventoryItem {
    id: string;
    product_id: string;
    name: string;
    quantity: number;
    unit_price: number;
    unit: string;
    category: string;
}

export function ConsultationInventoryManager() {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedItems, setSelectedItems] = useState<InventoryItem[]>([]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchTerm.length >= 2) {
                setIsLoading(true);
                const results = await getProducts(searchTerm);
                setSearchResults(results.filter((p: any) => !p.is_archived));
                setIsLoading(false);
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const addItem = (product: any) => {
        const existing = selectedItems.find(i => i.product_id === product.id);
        if (existing) {
            // Increment
            updateQuantity(product.id, existing.quantity + 1);
        } else {
            // Add new
            setSelectedItems(prev => [...prev, {
                id: crypto.randomUUID(),
                product_id: product.id,
                name: product.name,
                quantity: 1,
                unit_price: product.sale_price,
                unit: product.unit,
                category: product.category
            }]);
        }
        setSearchTerm(""); // Clear search to continue working
        setSearchResults([]);
    };

    const removeItem = (productId: string) => {
        setSelectedItems(prev => prev.filter(i => i.product_id !== productId));
    };

    const updateQuantity = (productId: string, newQty: number) => {
        if (newQty <= 0) return;
        setSelectedItems(prev => prev.map(i =>
            i.product_id === productId ? { ...i, quantity: newQty } : i
        ));
    };

    const calculateTotal = () => {
        return selectedItems.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border/40 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
                <Pill className="text-blue-600" />
                Receta e Insumos
            </h3>
            <p className="text-sm text-muted-foreground">Agrega medicamentos o insumos usados. Se descontarán del inventario automáticamente.</p>

            {/* Hidden Input for Form Submission */}
            <input type="hidden" name="inventoryItems" value={JSON.stringify(selectedItems)} />

            {/* Search Box */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                    type="text"
                    placeholder="Buscar producto (ej. Amoxicilina)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-foreground"
                />

                {/* Search Results Dropdown */}
                <AnimatePresence>
                    {searchResults.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl shadow-xl max-h-60 overflow-y-auto"
                        >
                            {searchResults.map(product => (
                                <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => addItem(product)}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex justify-between items-center border-b border-slate-100 dark:border-slate-800 last:border-0"
                                >
                                    <div>
                                        <p className="font-bold text-sm text-foreground">{product.name}</p>
                                        <p className="text-xs text-muted-foreground">{product.category} • stock: {product.totalStock} {product.unit}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Plus size={16} className="text-primary" />
                                    </div>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Selected Items List */}
            {selectedItems.length > 0 && (
                <div className="space-y-2 mt-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
                        {selectedItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                                <div className="flex-1">
                                    <p className="font-bold text-sm text-foreground">{item.name}</p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                            className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                                        >-</button>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateQuantity(item.product_id, parseFloat(e.target.value))}
                                            className="w-12 text-center text-sm font-bold border-x border-slate-200 dark:border-slate-700 py-1 bg-transparent focus:outline-none text-foreground"
                                            min="0.1"
                                            step="0.1"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                            className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                                        >+</button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(item.product_id)}
                                        className="text-red-400 hover:text-red-600 p-1"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
