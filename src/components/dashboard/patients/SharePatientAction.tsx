"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

export function SharePatientAction({ token }: { token: string }) {
    const copyLink = () => {
        if (!token) {
            toast.error("Este paciente no tiene token de acceso. Contacta a soporte.");
            return;
        }
        const url = `${window.location.origin}/share/${token}`;
        navigator.clipboard.writeText(url);
        toast.success("Enlace del Portal del Dueño copiado al portapapeles", {
            description: "Puedes enviarlo por WhatsApp al cliente."
        });
    };

    return (
        <button 
            onClick={copyLink}
            className="p-2 md:px-4 md:py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest border border-indigo-100 dark:border-indigo-800 shadow-sm"
            title="Compartir historial con el dueño"
        >
            <Share2 size={16} />
            <span className="hidden md:inline">Compartir Portal</span>
        </button>
    );
}
