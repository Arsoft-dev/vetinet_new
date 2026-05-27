"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function RealtimeBanner({ initialMessage }: { initialMessage: string | null }) {
    const [message, setMessage] = useState<string | null>(initialMessage);
    const supabase = createClient();

    useEffect(() => {
        // Escuchar cambios en la tabla system_announcements
        const channel = supabase
            .channel('system_announcements_changes')
            .on(
                'postgres_changes',
                {
                    event: '*', // Escuchar INSERT, UPDATE y DELETE
                    schema: 'public',
                    table: 'system_announcements'
                },
                () => {
                    // Cada vez que hay un cambio en la tabla, buscamos el anuncio activo más reciente
                    fetchLatest();
                }
            )
            .subscribe();

        const fetchLatest = async () => {
            const { data } = await supabase
                .from("system_announcements")
                .select("message")
                .eq("is_active", true)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();
                
            setMessage(data?.message || null);
        };

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    if (!message) return null;

    return (
        <div className="px-8 pt-6 pb-2 print:hidden animate-in slide-in-from-top-4 fade-in duration-500">
            <div className="max-w-7xl mx-auto">
                <div className="relative overflow-hidden bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-2xl p-[1px] shadow-lg shadow-indigo-500/20">
                    <div className="bg-slate-950/80 backdrop-blur-md rounded-2xl px-6 py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center animate-pulse">
                                <span className="text-indigo-400 text-sm">🔔</span>
                            </div>
                            <div>
                                <p className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-0.5">Anuncio del Sistema</p>
                                <p className="text-sm font-medium text-white">{message}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
