"use client";

import { useState } from "react";
import { postAnnouncement } from "@/actions/superadmin";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

export function BroadcastForm({ currentAnnouncement }: { currentAnnouncement: string }) {
    const [message, setMessage] = useState(currentAnnouncement);
    const [activeMessage, setActiveMessage] = useState(currentAnnouncement);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (textToSubmit: string) => {
        setLoading(true);
        const res = await postAnnouncement(textToSubmit);
        if (res.success) {
            setActiveMessage(textToSubmit);
            setMessage(textToSubmit);
            if (textToSubmit) {
                toast.success("Anuncio global actualizado.");
            } else {
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
                placeholder="Escribe un anuncio importante (ej. Mantenimiento programado)..."
                disabled={loading}
            ></textarea>
            
            <div className="flex gap-2 mt-auto">
                <button 
                    onClick={() => handleSubmit(message)}
                    disabled={loading || !message}
                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading && <Loader2 size={18} className="animate-spin" />}
                    {activeMessage ? "Actualizar" : "Emitir Anuncio"}
                </button>

                {activeMessage && (
                    <button 
                        onClick={() => handleSubmit("")}
                        disabled={loading}
                        className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-4 rounded-xl transition-colors flex items-center justify-center disabled:opacity-50"
                        title="Eliminar Anuncio"
                    >
                        <Trash2 size={20} />
                    </button>
                )}
            </div>
        </>
    );
}
