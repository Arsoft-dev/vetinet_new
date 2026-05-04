"use client";

import { useState } from "react";
import { postAnnouncement } from "@/actions/superadmin";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function BroadcastForm() {
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        const res = await postAnnouncement(message);
        if (res.success) {
            toast.success("Anuncio global actualizado.");
            if (!message) {
                toast.info("El anuncio ha sido removido.");
            }
        } else {
            toast.error(res.message);
        }
        setLoading(false);
    };

    return (
        <>
            <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 outline-none focus:border-indigo-500/50 resize-none h-32 mb-4"
                placeholder="Escribe un anuncio importante (ej. Mantenimiento programado). Deja en blanco para eliminar el anuncio actual..."
                disabled={loading}
            ></textarea>
            
            <button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition-colors mt-auto flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {message ? "Emitir Anuncio" : "Quitar Anuncio"}
            </button>
        </>
    );
}
