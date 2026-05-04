"use client";

import { useState, useTransition } from "react";
import { Plus, Search, Trash2, Edit2, X, Check, ClipboardList, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { saveProtocol, deleteProtocol } from "@/actions/protocols";
import { Drawer } from "vaul";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

interface Item {
    action: string;
    note: string;
}

interface Protocol {
    id?: string;
    name: string;
    description: string;
    items: Item[];
}

export function TreatmentProtocolsList({ initialProtocols }: { initialProtocols: any[] }) {
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProtocol, setEditingProtocol] = useState<Protocol | null>(null);
    const [isPending, startTransition] = useTransition();
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const filteredProtocols = initialProtocols.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
    );

    const openModal = (protocol?: Protocol) => {
        setEditingProtocol(protocol || { name: "", description: "", items: [{ action: "", note: "" }] });
        setIsModalOpen(true);
    };

    const addItem = () => {
        if (!editingProtocol) return;
        setEditingProtocol({
            ...editingProtocol,
            items: [...editingProtocol.items, { action: "", note: "" }]
        });
    };

    const removeItem = (index: number) => {
        if (!editingProtocol) return;
        const newItems = editingProtocol.items.filter((_, i) => i !== index);
        setEditingProtocol({ ...editingProtocol, items: newItems });
    };

    const updateItem = (index: number, field: keyof Item, value: string) => {
        if (!editingProtocol) return;
        const newItems = [...editingProtocol.items];
        newItems[index][field] = value;
        setEditingProtocol({ ...editingProtocol, items: newItems });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProtocol) return;

        startTransition(async () => {
            try {
                await saveProtocol(editingProtocol as any);
                toast.success(editingProtocol.id ? "Protocolo actualizado" : "Protocolo creado");
                setIsModalOpen(false);
            } catch (error: any) {
                toast.error(error.message);
            }
        });
    };

    const handleDelete = async () => {
        if (!deleteConfirmId) return;
        startTransition(async () => {
            try {
                await deleteProtocol(deleteConfirmId);
                toast.success("Protocolo eliminado");
                setDeleteConfirmId(null);
            } catch (error: any) {
                toast.error(error.message);
            }
        });
    };

    const FormContent = editingProtocol && (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nombre del Protocolo</label>
                    <input
                        value={editingProtocol.name}
                        onChange={(e) => setEditingProtocol({ ...editingProtocol, name: e.target.value })}
                        placeholder="Ej. Protocolo Gastroenteritis"
                        required
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold dark:text-slate-100"
                    />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Descripción Breve</label>
                    <textarea
                        value={editingProtocol.description}
                        onChange={(e) => setEditingProtocol({ ...editingProtocol, description: e.target.value })}
                        placeholder="Indica para qué sirve este protocolo..."
                        rows={2}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-medium text-sm dark:text-slate-100"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <ClipboardList size={18} className="text-primary" />
                        Pasos del Tratamiento
                    </label>
                    <button type="button" onClick={addItem} className="text-xs font-black text-primary hover:text-primary/80 flex items-center gap-1 bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10 transition-colors uppercase tracking-widest">
                        <Plus size={14} /> Añadir Paso
                    </button>
                </div>

                <div className="space-y-3">
                    {editingProtocol.items.map((item, index) => (
                        <motion.div layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={index} className="flex gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 group/item">
                            <div className="flex-1 space-y-3">
                                <input
                                    value={item.action}
                                    onChange={(e) => updateItem(index, 'action', e.target.value)}
                                    placeholder="Acción (Ej. Aplicar Amoxicilina)"
                                    required
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 dark:text-slate-100"
                                />
                                <input
                                    value={item.note}
                                    onChange={(e) => updateItem(index, 'note', e.target.value)}
                                    placeholder="Nota/Dosis (Ej. 5ml cada 12h)"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/10 dark:text-slate-100"
                                />
                            </div>
                            <button type="button" onClick={() => removeItem(index)} className="self-start p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover/item:opacity-100">
                                <Trash2 size={18} />
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors">Cancelar</button>
                <button
                    onClick={handleSubmit}
                    disabled={isPending || editingProtocol.items.length === 0}
                    className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isPending ? "Guardando..." : <><Check size={20} /> Guardar Protocolo</>}
                </button>
            </div>
        </form>
    );

    return (
        <div className="space-y-6">
            {/* Search & Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-md group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar protocolos..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-border/40 dark:border-slate-800 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-slate-100"
                    />
                </div>
                <button
                    onClick={() => openModal()}
                    className="w-full md:w-auto px-6 py-3 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                    <Plus size={20} />
                    Nuevo Protocolo
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredProtocols.map((p) => (
                        <motion.div
                            key={p.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-border/40 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                                    <ClipboardList size={24} />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openModal(p)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => setDeleteConfirmId(p.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{p.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{p.description || "Sin descripción."}</p>
                            
                            <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{p.items?.length || 0} Pasos</span>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {p.items?.slice(0, 2).map((item: any, i: number) => (
                                        <span key={i} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-lg border border-slate-100 dark:border-slate-700 truncate max-w-[120px]">
                                            • {item.action}
                                        </span>
                                    ))}
                                    {p.items?.length > 2 && <span className="px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-400 text-[10px] font-bold rounded-lg tracking-tighter">+{p.items.length - 2} más</span>}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Protocol Modal */}
            <AnimatePresence>
                {isModalOpen && editingProtocol && (
                    isDesktop ? (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                                <div className="p-6 border-b border-border/10 flex items-center justify-between shrink-0">
                                    <h3 className="text-xl font-bold flex items-center gap-2 dark:text-slate-100 italic uppercase">
                                        {editingProtocol.id ? "Editar Protocolo" : "Nuevo Protocolo"}
                                    </h3>
                                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                        <X size={20} className="text-slate-400" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {FormContent}
                                </div>
                            </motion.div>
                        </div>
                    ) : (
                        <Drawer.Root open={isModalOpen} onOpenChange={(open) => !open && setIsModalOpen(false)}>
                            <Drawer.Portal>
                                <Drawer.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
                                <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[2.5rem] mt-24 fixed bottom-0 left-0 right-0 z-[110] focus:outline-none max-h-[96vh]">
                                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 my-4" />
                                    <div className="px-6 pb-2">
                                        <Drawer.Title className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight italic uppercase">
                                            {editingProtocol.id ? "Editar" : "Nuevo"} Protocolo
                                        </Drawer.Title>
                                        <Drawer.Description className="sr-only">Formulario para crear o editar un protocolo de tratamiento.</Drawer.Description>
                                    </div>
                                    <div className="flex-1 overflow-y-auto pb-8">
                                        {FormContent}
                                    </div>
                                </Drawer.Content>
                            </Drawer.Portal>
                        </Drawer.Root>
                    )
                )}

                <ConfirmationModal
                    isOpen={!!deleteConfirmId}
                    onClose={() => setDeleteConfirmId(null)}
                    onConfirm={handleDelete}
                    title="¿Eliminar Protocolo?"
                    description="Esta acción borrará la plantilla permanentemente. No podrás recuperarla después."
                    confirmText="Sí, Eliminar"
                    isDestructive={true}
                    isLoading={isPending}
                />
            </AnimatePresence>
        </div>
    );
}
