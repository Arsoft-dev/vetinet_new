"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton({ fallbackUrl = "/" }: { fallbackUrl?: string }) {
    const router = useRouter();

    const handleBack = () => {
        // Just go back to the previous page in history
        router.back();
    };

    return (
        <button 
            onClick={handleBack} 
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
            title="Volver atrás"
        >
            <ArrowLeft size={20} className="text-slate-500" />
        </button>
    );
}
