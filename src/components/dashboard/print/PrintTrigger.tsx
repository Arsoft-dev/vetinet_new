"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";

export function PrintTrigger() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Delay ensures styles and fonts are loaded before print dialog opens
        const timeout = setTimeout(() => {
            window.print();
        }, 800);
        return () => clearTimeout(timeout);
    }, []);

    if (!isMounted) return null;

    return (
        <div className="fixed top-6 right-8 print:hidden z-50 animate-in fade-in slide-in-from-top-4 duration-500">
            <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-black text-white px-5 py-3 rounded-full font-bold shadow-xl hover:scale-105 hover:shadow-2xl transition-all hover:bg-gray-800"
            >
                <Printer size={18} />
                <span>Imprimir / Guardar PDF</span>
            </button>
        </div>
    );
}
