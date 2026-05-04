"use client";

import { Search, Filter } from "lucide-react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

export function PatientSearch() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("query", term);
        } else {
            params.delete("query");
        }
        replace(`${pathname}?${params.toString()}`);
    }, 300);

    return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-border/10 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 transition-colors">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                    type="text"
                    placeholder="Buscar por nombre, propietario o raza..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 dark:text-slate-100"
                    defaultValue={searchParams.get("query")?.toString()}
                    onChange={(e) => handleSearch(e.target.value)}
                />
            </div>
            {/* Filter button can be expanded later */}
            <button className="flex items-center gap-2 px-6 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-400 transition-all">
                <Filter size={18} />
                Filtros
            </button>
        </div>
    );
}
