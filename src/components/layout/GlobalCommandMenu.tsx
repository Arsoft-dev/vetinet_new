"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { Search, User, Package, FileText, PlusCircle, Activity, CalendarDays, BarChart3, Settings } from "lucide-react";

export function GlobalCommandMenu() {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    // Toggle the menu when ⌘K is pressed
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    // Also close on escape
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-center items-start pt-[15vh] px-4" onClick={() => setOpen(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden w-full max-w-xl border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                <Command
                    className="w-full h-full flex flex-col"
                    filter={(value, search) => {
                        if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                        return 0;
                    }}
                >
                    <div className="flex items-center px-4 border-b border-slate-100 dark:border-slate-800 text-slate-500 gap-3">
                        <Search size={20} className="text-slate-400" />
                        <Command.Input 
                            autoFocus
                            placeholder="Buscar acciones, páginas o escribir un comando..." 
                            className="flex-1 h-14 bg-transparent focus:outline-none placeholder:text-slate-400 font-medium text-slate-800 dark:text-slate-100 text-lg"
                        />
                        <div className="hidden sm:flex items-center gap-1">
                            <kbd className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-mono font-bold text-slate-400 border border-slate-200 dark:border-slate-700">ESC</kbd>
                        </div>
                    </div>

                    <Command.List className="max-h-[350px] overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                        <Command.Empty className="p-6 text-center text-sm text-slate-500 font-medium">No se encontraron resultados para esta búsqueda.</Command.Empty>

                        <Command.Group heading="Acciones Rápidas" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:text-slate-400 [&_[cmdk-group-heading]]:uppercase mb-2">
                            <Command.Item 
                                onSelect={() => { setOpen(false); router.push('/dashboard/billing/pos'); }}
                                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/30 aria-selected:bg-emerald-50 dark:aria-selected:bg-emerald-900/30 aria-selected:text-emerald-700 dark:aria-selected:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-400 font-medium transition-colors"
                            >
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-500 rounded-lg"><FileText size={16} /></div>
                                Nueva Venta (Punto de Venta)
                            </Command.Item>
                            
                            <Command.Item 
                                onSelect={() => { setOpen(false); router.push('/dashboard/patients/new'); }}
                                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-900/30 aria-selected:text-blue-700 dark:aria-selected:text-blue-400 hover:text-blue-700 dark:hover:text-blue-400 font-medium transition-colors mt-1"
                            >
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-500 rounded-lg"><PlusCircle size={16} /></div>
                                Registrar Nuevo Paciente
                            </Command.Item>
                        </Command.Group>

                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>

                        <Command.Group heading="Navegación Principal" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:text-slate-400 [&_[cmdk-group-heading]]:uppercase mb-2">
                            <Command.Item 
                                onSelect={() => { setOpen(false); router.push('/dashboard/patients'); }}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 font-medium transition-colors"
                            >
                                <User size={18} className="text-slate-400" />
                                Directorio de Pacientes
                            </Command.Item>
                            <Command.Item 
                                onSelect={() => { setOpen(false); router.push('/dashboard/hospital'); }}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 font-medium transition-colors mt-1"
                            >
                                <Activity size={18} className="text-slate-400" />
                                Área de Hospitalización
                            </Command.Item>
                            <Command.Item 
                                onSelect={() => { setOpen(false); router.push('/dashboard/calendar'); }}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 font-medium transition-colors mt-1"
                            >
                                <CalendarDays size={18} className="text-slate-400" />
                                Agenda de Citas
                            </Command.Item>
                            <Command.Item 
                                onSelect={() => { setOpen(false); router.push('/dashboard/inventory'); }}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 font-medium transition-colors mt-1"
                            >
                                <Package size={18} className="text-slate-400" />
                                Inventario de Productos
                            </Command.Item>
                            <Command.Item 
                                onSelect={() => { setOpen(false); router.push('/dashboard/reports'); }}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 font-medium transition-colors mt-1"
                            >
                                <BarChart3 size={18} className="text-slate-400" />
                                Reportes y Métricas
                            </Command.Item>
                            <Command.Item 
                                onSelect={() => { setOpen(false); router.push('/dashboard/settings'); }}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 font-medium transition-colors mt-1"
                            >
                                <Settings size={18} className="text-slate-400" />
                                Configuración de la Clínica
                            </Command.Item>
                        </Command.Group>
                    </Command.List>
                </Command>
            </div>
        </div>
    );
}
