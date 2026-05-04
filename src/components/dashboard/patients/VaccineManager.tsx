"use client";

import { useState } from "react";
import { Syringe } from "lucide-react";
import { VaccineModal } from "./VaccineModal";

export function VaccineManager({ petId }: { petId: string }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-border/60 dark:border-slate-800 text-foreground rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:border-primary/30 dark:hover:border-primary/50 hover:text-primary"
            >
                <Syringe size={18} />
                Vacuna
            </button>

            {isModalOpen && (
                <VaccineModal
                    onClose={() => setIsModalOpen(false)}
                    petId={petId}
                />
            )}
        </>
    );
}
