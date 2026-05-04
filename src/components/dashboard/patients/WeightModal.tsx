"use client";

import { useState } from "react";
import { X, Save, Scale } from "lucide-react";
import { updatePetWeight } from "@/actions/update-pet-weight";

import { Drawer } from "vaul";
import { useMediaQuery } from "@/hooks/use-media-query";

interface WeightModalProps {
    isOpen: boolean;
    onClose: () => void;
    petId: string;
    currentWeight?: number | null;
}

export function WeightModal({ isOpen, onClose, petId, currentWeight }: WeightModalProps) {
    const [weight, setWeight] = useState<string>(currentWeight ? currentWeight.toString() : "");
    const [isLoading, setIsLoading] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const numericWeight = parseFloat(weight);
        if (isNaN(numericWeight)) {
            setIsLoading(false);
            return;
        }

        const res = await updatePetWeight(petId, numericWeight);

        setIsLoading(false);
        if (res.success) {
            onClose();
        } else {
            alert(res.message);
        }
    };

    const FormContent = (
        <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
                <div className="relative group">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Peso Actual (kg)</label>
                    <div className="relative">
                        <input
                            type="number"
                            step="0.01"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground"
                            autoFocus
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none">kg</span>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl font-bold text-sm transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || !weight}
                        className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {isLoading ? "Guardando..." : "Guardar"}
                    </button>
                </div>
            </div>
        </form>
    );

    if (isDesktop) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
                <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 relative" onClick={e => e.stopPropagation()}>
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                        <h3 className="text-lg font-bold font-heading text-foreground flex items-center gap-2">
                            <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex items-center justify-center text-primary">
                                <Scale size={18} />
                            </div>
                            Actualizar Peso
                        </h3>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-foreground transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                    {FormContent}
                </div>
            </div>
        );
    }

    return (
        <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
                <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[24px] h-auto mt-24 fixed bottom-0 left-0 right-0 z-[60] focus:outline-none">
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-t-[24px] flex-1 overflow-y-auto">
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 mb-6" />
                        <Drawer.Title className="sr-only">Actualizar Peso</Drawer.Title>
                        <Drawer.Description className="sr-only">Formulario para registrar el peso actual.</Drawer.Description>
                        <div className="mb-2 px-6 flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                <Scale size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Actualizar Peso</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Registra el peso actual en kilogramos.</p>
                            </div>
                        </div>
                        {FormContent}
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
