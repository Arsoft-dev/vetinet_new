"use client";

import { Activity } from "lucide-react";
import { useState } from "react";
import { WeightModal } from "../patients/WeightModal";

interface WeightActionProps {
    petId: string;
    currentWeight?: number | null;
}

export function WeightAction({ petId, currentWeight }: WeightActionProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-border/60 dark:border-slate-800 text-foreground rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                title="Actualizar Peso"
            >
                <Activity size={18} className="text-gray-500" />
                Peso
            </button>

            <WeightModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                petId={petId}
                currentWeight={currentWeight}
            />
        </>
    );
}
