"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Check, Trash2, Calendar, Package, TrendingUp, AlertTriangle } from "lucide-react";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from "@/actions/notifications";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

export function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);

    const refresh = async () => {
        const [data, count] = await Promise.all([
            getNotifications(),
            getUnreadCount()
        ]);
        setNotifications(data);
        setUnreadCount(count);
    };

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id: string) => {
        await markAsRead(id);
        refresh();
    };

    const handleMarkAll = async () => {
        await markAllAsRead();
        refresh();
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'bcv_change': return <TrendingUp className="text-emerald-500" size={18} />;
            case 'stock_low': return <Package className="text-amber-500" size={18} />;
            case 'stock_expiring': return <AlertTriangle className="text-rose-500" size={18} />;
            case 'appointment': return <Calendar className="text-blue-500" size={18} />;
            default: return <Bell className="text-slate-400" size={18} />;
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all relative ${isOpen ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white dark:bg-slate-800 border border-border/60 dark:border-slate-700 text-muted-foreground hover:text-primary hover:border-primary/30'
                    }`}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white dark:border-slate-900 text-[8px] text-white items-center justify-center font-bold">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="fixed md:absolute inset-x-4 md:inset-x-auto md:right-0 mt-3 md:w-96 bg-white dark:bg-slate-900 border border-border/40 dark:border-slate-800 rounded-3xl shadow-2xl z-[999] overflow-hidden"
                    >
                        <div className="p-6 border-b border-border/10 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Notificaciones</h3>
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{unreadCount} Pendientes</p>
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAll}
                                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-all"
                                >
                                    Leer Todas
                                </button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length > 0 ? (
                                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            className={`p-5 flex gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all cursor-pointer group relative ${!n.is_read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                                            onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                                        >
                                            <div className="shrink-0">
                                                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-border/10 dark:border-slate-700 flex items-center justify-center shadow-sm">
                                                    {getIcon(n.type)}
                                                </div>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className={`text-sm font-bold truncate transition-colors ${!n.is_read ? 'text-slate-900 dark:text-slate-100 font-extrabold' : 'text-slate-600 dark:text-slate-400'}`}>
                                                        {n.title}
                                                    </p>
                                                    <span className="text-[9px] font-bold text-slate-400 shrink-0 uppercase tracking-tighter">
                                                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">{n.message}</p>
                                            </div>
                                            {!n.is_read && (
                                                <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 rounded-[2rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-200 dark:text-slate-700 mb-4">
                                        <Bell size={32} />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500">No tienes notificaciones aún</p>
                                    <p className="text-[10px] text-slate-300 dark:text-slate-600 font-bold uppercase tracking-widest mt-1">Tu clínica está al día</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-border/10 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                            <button className="w-full py-3 bg-white dark:bg-slate-800 border border-border/40 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                                Ver todas las alertas
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
