"use client";

import { useState, useEffect } from "react";
import { X, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { adjustInventory } from "@/actions/inventory";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Drawer } from "vaul";
import { motion, AnimatePresence } from "framer-motion";

interface ManualAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
}

export function ManualAdjustmentModal({ isOpen, onClose, product }: ManualAdjustmentModalProps) {
    const [quantity, setQuantity] = useState("");
    const [type, setType] = useState<"consumption" | "adjustment" | "return">("consumption");
    const [isNegative, setIsNegative] = useState(true); // Reducir stock por defecto
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
    const [userRole, setUserRole] = useState("staff");

    const router = useRouter();
    const isDesktop = useMediaQuery("(min-width: 768px)");

    // Cargar almacenes y rol del usuario clínico al abrir el modal
    useEffect(() => {
        async function loadData() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Obtener rol y clínica del usuario
            const { data: member } = await supabase
                .from("clinic_members")
                .select("role, clinic_id")
                .eq("user_id", user.id)
                .single();

            if (!member) return;
            setUserRole(member.role);

            // Obtener almacenes activos
            let query = supabase
                .from("warehouses")
                .select("id, name, type")
                .eq("clinic_id", member.clinic_id)
                .eq("is_active", true);

            // Si es veterinario, restringir solo a sus consultorios
            if (member.role === "vet") {
                query = query.eq("type", "consulting");
            }

            const { data: whs } = await query.order("name");
            if (whs && whs.length > 0) {
                setWarehouses(whs);
                setSelectedWarehouseId(whs[0].id);
            } else if (member.role === "vet") {
                const { data: fallbackWhs } = await supabase
                    .from("warehouses")
                    .select("id, name, type")
                    .eq("clinic_id", member.clinic_id)
                    .eq("is_active", true)
                    .order("name");
                if (fallbackWhs && fallbackWhs.length > 0) {
                    setWarehouses(fallbackWhs);
                    setSelectedWarehouseId(fallbackWhs[0].id);
                }
            }
        }

        if (isOpen && product) {
            loadData();
        }
    }, [isOpen, product]);

    if (!isOpen || !product) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quantity || parseFloat(quantity) <= 0) {
            toast.error("Ingresa una cantidad válida");
            return;
        }

        if (!selectedWarehouseId) {
            toast.error("Debes seleccionar un almacén para aplicar el ajuste");
            return;
        }

        setIsSubmitting(true);
        try {
            const finalQuantity = isNegative ? -parseFloat(quantity) : parseFloat(quantity);
            const notes = reason || (type === 'consumption' ? 'Autoconsumo / Venta rápida' : 'Ajuste manual');

            const res = await adjustInventory(
                product.id,
                selectedWarehouseId,
                finalQuantity,
                type,
                notes
            );

            if (!res.success) {
                throw new Error(res.message);
            }

            toast.success(res.message);
            router.refresh();
            onClose();
            setQuantity("");
            setReason("");
        } catch (error: any) {
            console.error("Error adjusting stock:", error);
            toast.error(error.message || "Error al actualizar inventario");
        } finally {
            setIsSubmitting(false);
        }
    };

    const FormContent = (
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Action Type Selector - More Compact */}
            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={() => setIsNegative(true)}
                    className={`flex items-center justify-center p-2.5 rounded-xl border-2 transition-all gap-2 ${
                        isNegative 
                        ? "border-red-500 bg-red-50 dark:bg-red-900/10 text-red-600" 
                        : "border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200"
                    }`}
                >
                    <ArrowDownCircle size={18} />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Retirar Stock</span>
                </button>
                <button
                    type="button"
                    onClick={() => setIsNegative(false)}
                    className={`flex items-center justify-center p-2.5 rounded-xl border-2 transition-all gap-2 ${
                        !isNegative 
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600" 
                        : "border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200"
                    }`}
                >
                    <ArrowUpCircle size={18} />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Agregar Stock</span>
                </button>
            </div>

            {/* Selector de almacén dinámico */}
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">
                    Almacén a Afectar
                </label>
                {warehouses.length > 1 ? (
                    <select
                        value={selectedWarehouseId}
                        onChange={(e) => setSelectedWarehouseId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                        {warehouses.map(w => (
                            <option key={w.id} value={w.id}>
                                {w.name} ({w.type === 'consulting' ? 'Consultorio' : w.type === 'storage' ? 'Bodega' : 'Otros'})
                            </option>
                        ))}
                    </select>
                ) : warehouses.length === 1 ? (
                    <div className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-650 dark:text-slate-350">
                        {warehouses[0].name}
                    </div>
                ) : (
                    <div className="w-full px-3 py-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl font-bold text-xs text-red-650 dark:text-red-350">
                        Cargando almacenes activos...
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Tipo</label>
                    <select 
                        value={type}
                        onChange={(e) => setType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                        <option value="consumption">Autoconsumo</option>
                        <option value="adjustment">Ajuste / Merma</option>
                        <option value="return">Devolución</option>
                    </select>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Cantidad</label>
                    <div className="relative">
                        <input
                            type="number"
                            step="any"
                            required
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm text-foreground"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 uppercase">
                            {product.unit}
                        </span>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Motivo / Notas</label>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Escribe el motivo..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium text-xs min-h-[60px] resize-none text-foreground"
                />
            </div>

            <div className="flex gap-2 pt-1">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || !selectedWarehouseId}
                    className={`flex-1 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-white shadow-lg transition-all ${
                        isSubmitting || !selectedWarehouseId ? 'opacity-50 cursor-not-allowed' : 
                        isNegative ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                    }`}
                >
                    {isSubmitting ? '...' : 'Confirmar'}
                </button>
            </div>
        </form>
    );

    if (isDesktop) {
        return (
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-border/40 dark:border-slate-800"
                        >
                            <div className="p-4 border-b border-border/40 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                                <div>
                                    <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Ajuste de Inventario</h2>
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">{product.name}</p>
                                </div>
                                <button onClick={onClose} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400">
                                    <X size={18} />
                                </button>
                            </div>
                            {FormContent}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        );
    }

    return (
        <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[140]" />
                <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[24px] mt-24 fixed bottom-0 left-0 right-0 z-[150] focus:outline-none max-h-[96vh]">
                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 my-3" />
                    <Drawer.Title className="sr-only">Ajuste de Inventario</Drawer.Title>
                    <Drawer.Description className="sr-only">Formulario para realizar un ajuste de inventario manual.</Drawer.Description>
                    
                    <div className="px-6 py-2 border-b border-border/40 dark:border-slate-800">
                        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Ajuste de Inventario</h2>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">{product.name}</p>
                    </div>

                    <div className="flex-1 overflow-y-auto pb-4">
                        {FormContent}
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
