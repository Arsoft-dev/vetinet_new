"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw, HeartPulse } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function OfflineDetector({ children }: { children: React.ReactNode }) {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // Set initial state
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return (
        <>
            <AnimatePresence>
                {!isOnline && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-slate-900 flex items-center justify-center p-6 text-center"
                    >
                        <div className="max-w-sm w-full space-y-8">
                            <div className="relative inline-block">
                                <div className="w-32 h-32 bg-emerald-500/10 rounded-[3rem] flex items-center justify-center text-emerald-500 animate-pulse">
                                    <HeartPulse size={64} />
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white border-4 border-slate-900 shadow-xl">
                                    <WifiOff size={20} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h2 className="text-2xl font-black text-white tracking-tight">¡Ups! Perdimos la señal</h2>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Parece que tu conexión a internet se ha tomado un descanso. <br />
                                    <span className="text-emerald-400 font-bold">Estamos intentando reconectar...</span>
                                </p>
                            </div>

                            <div className="pt-4">
                                <button 
                                    onClick={() => window.location.reload()}
                                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl active:scale-95"
                                >
                                    <RefreshCw size={16} className="animate-spin-slow" />
                                    Reintentar ahora
                                </button>
                            </div>

                            <div className="pt-8 flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                Vetinet está listo para volver
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {children}
        </>
    );
}
