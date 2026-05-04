"use client";

import { useState, useEffect } from "react";
import { Menu, Search, User, ChevronDown, Settings, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useSidebar } from "@/contexts/SidebarContext";
import { NotificationCenter } from "./notifications/NotificationCenter";
import { ThemeToggle } from "../layout/ThemeToggle";

export function Header() {
    const { toggle } = useSidebar();
    const [user, setUser] = useState<any>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                // Fetch full profile to get avatar_url
                const { data: profile } = await supabase
                    .from("users")
                    .select("*")
                    .eq("id", authUser.id)
                    .single();
                
                setUser({ ...authUser, ...profile });
            }
        };
        getUser();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
    };

    return (
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-border/40 dark:border-slate-800 sticky top-0 z-[50] px-4 md:px-8 flex items-center justify-between gap-4 print:hidden transition-colors">

            {/* Mobile Menu Button */}
            <button onClick={toggle} className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground">
                <Menu size={24} />
            </button>

            {/* Empty space where search was */}
            <div className="flex-1 hidden md:block" />

            {/* Right Actions */}
            <div className="flex items-center gap-2 md:gap-4">

                {/* Global Search Button */}
                <button
                    onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                    className="p-2 md:px-4 md:py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-all flex items-center gap-2 border border-transparent dark:border-slate-700"
                    title="Buscar (Ctrl+K)"
                >
                    <Search size={20} />
                    <span className="hidden md:inline font-bold text-sm">Buscar...</span>
                    <kbd className="hidden md:inline bg-white dark:bg-slate-900 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-slate-400 border border-slate-200 dark:border-slate-700 ml-2">⌘K</kbd>
                </button>

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Notifications */}
                <NotificationCenter />

                {/* User Profile Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-3 pl-4 border-l border-border/40 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors py-2 px-3 rounded-2xl group"
                    >
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">
                                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Usuario"}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {user?.user_metadata?.role || "Admin"}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all shadow-sm overflow-hidden">
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={20} />
                            )}
                        </div>
                        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-[-1]" onClick={() => setIsMenuOpen(false)} />
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 border border-border/40 dark:border-slate-800 rounded-3xl shadow-2xl p-2 z-[60] overflow-hidden"
                                >
                                    <div className="p-3 mb-2 border-b border-slate-50 dark:border-slate-800">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Mi Cuenta</p>
                                    </div>
                                    <button 
                                        onClick={() => { window.location.href = "/dashboard/settings"; setIsMenuOpen(false); }}
                                        className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm transition-colors"
                                    >
                                        <Settings size={18} className="text-slate-400" />
                                        Configuración
                                    </button>
                                    <button 
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 font-bold text-sm transition-colors mt-1"
                                    >
                                        <LogOut size={18} />
                                        Cerrar Sesión
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
}
