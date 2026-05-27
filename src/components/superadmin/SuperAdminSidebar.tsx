"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Building2, LayoutDashboard, Menu, X } from "lucide-react";
import { SuperAdminLogout } from "@/components/superadmin/LogoutButton";

export function SuperAdminSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800">
                <div className="flex items-center gap-2 text-indigo-400">
                    <ShieldCheck size={24} />
                    <span className="font-black text-lg tracking-widest uppercase">Super Admin</span>
                </div>
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Backdrop for mobile */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 flex flex-col
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="h-20 hidden md:flex items-center justify-center border-b border-slate-800">
                    <div className="flex items-center gap-2 text-indigo-400">
                        <ShieldCheck size={28} />
                        <span className="font-black text-xl tracking-widest uppercase">Super Admin</span>
                    </div>
                </div>
                
                <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800">
                    <span className="font-black text-lg text-indigo-400 tracking-widest uppercase">Menu</span>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <Link 
                        href="/superadmin" 
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-bold ${isActive('/superadmin') ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <LayoutDashboard size={20} />
                        Dashboard
                    </Link>
                    <Link 
                        href="/superadmin/clinics" 
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-bold ${isActive('/superadmin/clinics') ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <Building2 size={20} />
                        Clínicas
                    </Link>
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <SuperAdminLogout />
                </div>
            </aside>
        </>
    );
}
