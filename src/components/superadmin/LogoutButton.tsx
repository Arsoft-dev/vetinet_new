"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SuperAdminLogout() {
    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = "/login";
    };

    return (
        <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-sm font-bold"
        >
            <LogOut size={20} />
            Cerrar Sesión
        </button>
    );
}
