"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { saveVaccine } from "@/actions/save-vaccine";
import { X, Syringe, Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

// --- Submit Button ---
function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full flex justify-center items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-70"
        >
            {pending ? "Guardando..." : "Registrar Vacuna"}
            <Save size={18} />
        </button>
    );
}

import { Drawer } from "vaul";
import { useMediaQuery } from "@/hooks/use-media-query";

// --- Modal Component ---
interface VaccineModalProps {
    onClose: () => void;
    petId: string;
}

export function VaccineModal({ onClose, petId }: VaccineModalProps) {
    const saveWithId = saveVaccine.bind(null, petId);
    // @ts-ignore
    const [state, formAction] = useActionState(saveWithId, { success: false, message: "" });
    const isDesktop = useMediaQuery("(min-width: 768px)");

    // Handle success/error side effects
    useEffect(() => {
        if (state?.success) {
            toast.success("Vacuna registrada correctamente");
            onClose();
        } else if (state?.message) {
            toast.error(state.message);
        }
    }, [state, onClose]);

    const FormContent = (
        <form action={formAction} className="p-6 space-y-5">
            <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Nombre de la Vacuna</label>
                <input
                    name="vaccineName"
                    list="vaccine-list"
                    placeholder="Ej. Rabia, Sextuple..."
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-base text-foreground"
                />
                <datalist id="vaccine-list">
                    <option value="Rabia" />
                    <option value="Sextuple" />
                    <option value="Triple Felina" />
                    <option value="Bordetella" />
                    <option value="Leucemia Felina" />
                    <option value="Parvovirus" />
                </datalist>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Lote / Serie (Opcional)</label>
                <input
                    name="batchNumber"
                    placeholder="Ej. A123-BC"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-base text-foreground"
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Próxima Dosis (Vencimiento)</label>
                <div className="relative">
                    <input
                        type="date"
                        name="nextDueDate"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-base text-foreground"
                    />
                    <AlertTriangle size={16} className="absolute right-4 top-3.5 text-orange-400 pointer-events-none" />
                </div>
                <p className="text-xs text-muted-foreground ml-1">Para generar alertas automáticas.</p>
            </div>

            <div className="pt-4 pb-8 md:pb-0">
                <SubmitButton />
            </div>
        </form>
    );

    if (isDesktop) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative" onClick={e => e.stopPropagation()}>
                    <div className="bg-primary/5 p-4 border-b border-primary/10 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                            <Syringe size={20} />
                            Nueva Vacuna
                        </h3>
                        <button onClick={onClose} className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-full text-foreground/50 hover:text-foreground transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    {FormContent}
                </div>
            </div>
        );
    }

    return (
        <Drawer.Root open={true} onOpenChange={(open) => !open && onClose()}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
                <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[24px] h-auto mt-24 fixed bottom-0 left-0 right-0 z-[60] focus:outline-none">
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-t-[24px] flex-1 overflow-y-auto">
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 mb-6" />
                        <Drawer.Title className="sr-only">Nueva Vacuna</Drawer.Title>
                        <Drawer.Description className="sr-only">Formulario para registrar una nueva vacuna.</Drawer.Description>
                        <div className="mb-2 px-6">
                            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Syringe size={24} className="text-primary" />
                                Nueva Vacuna
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Registra la aplicación de una vacuna para este paciente.</p>
                        </div>
                        {FormContent}
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
