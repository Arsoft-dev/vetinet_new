"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutGrid,
    Users,
    CalendarDays,
    Activity,
    Stethoscope,
    Pill,
    Settings,
    LogOut,
    Boxes,
    Package,
    Receipt,
    X,
    PawPrint,
    ChevronLeft,
    ChevronRight,
    PanelLeftClose,
    PanelLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";

const menuItems = [
    { icon: LayoutGrid, label: "Dashboard", href: "/dashboard", roles: ['admin', 'vet', 'cashier', 'receptionist'] },
    { icon: PawPrint, label: "Pacientes", href: "/dashboard/patients", roles: ['admin', 'vet', 'receptionist'] },
    { icon: CalendarDays, label: "Agenda", href: "/dashboard/calendar", roles: ['admin', 'vet', 'cashier', 'receptionist'] },
    { icon: Stethoscope, label: "Consultas", href: "/dashboard/consultations", roles: ['admin', 'vet'] },
    { icon: Activity, label: "Hospital", href: "/dashboard/hospital", roles: ['admin', 'vet'] },
    { icon: Pill, label: "Tratamientos", href: "/dashboard/treatments", roles: ['admin', 'vet'] },
    { icon: Boxes, label: "Inventario", href: "/dashboard/inventory", roles: ['admin', 'cashier'] },
    { icon: Receipt, label: "Facturación", href: "/dashboard/billing", roles: ['admin', 'cashier'] },
    { icon: Settings, label: "Configuración", href: "/dashboard/settings", roles: ['admin', 'vet', 'cashier', 'receptionist'] }, // Settings handles own roles internally
];

export function Sidebar({ userRole = 'staff', isSuperAdmin = false }: { userRole?: string, isSuperAdmin?: boolean }) {
    const pathname = usePathname();
    const { isOpen, isCollapsed, toggleCollapse, close } = useSidebar();
    
    // Fallback logic for basic user (treat 'staff' as 'admin' temporarily if not strictly defined)
    const normalizedRole = ['admin', 'vet', 'cashier', 'receptionist'].includes(userRole) ? userRole : 'admin';

    const visibleItems = menuItems.filter(item => item.roles.includes(normalizedRole));

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[100] md:hidden backdrop-blur-sm"
                    onClick={close}
                />
            )}            <aside className={cn(
                "flex flex-col h-screen bg-white dark:bg-slate-900 border-r border-border/40 dark:border-slate-800 fixed left-0 top-0 z-[110] transition-all duration-200 md:translate-x-0 print:hidden",
                isOpen ? "translate-x-0" : "-translate-x-full",
                isCollapsed ? "w-20" : "w-64"
            )}>

                {/* Logo Area */}
                <div className={cn(
                    "h-20 flex items-center border-b border-border/5 dark:border-slate-800/50 relative bg-slate-50/50 dark:bg-slate-900/50 transition-all duration-200",
                    isCollapsed ? "px-2 justify-center" : "px-6"
                )}>
                    <Link href="/dashboard" className={cn("flex items-center group/logo transition-all duration-200", isCollapsed ? "gap-0" : "gap-3")} onClick={close}>
                        <div className="relative shrink-0 flex items-center justify-center">
                            <img src="/icono.png" alt="Logo" className={cn("object-contain drop-shadow-xl transition-all duration-200", isCollapsed ? "h-9 w-9" : "h-12 w-12")} />
                            <div className="absolute -inset-2 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover/logo:opacity-100 transition-opacity" />
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
                                <span className="font-heading font-black text-xl text-slate-900 dark:text-white tracking-tighter leading-none">Vetinet</span>
                                <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mt-1 opacity-80">Elite SaaS</span>
                            </div>
                        )}
                    </Link>
                    
                    {/* Desktop Collapse Toggle */}
                    <button 
                        onClick={(e) => { e.preventDefault(); toggleCollapse(); }} 
                        className={cn(
                            "hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl items-center justify-center text-slate-400 hover:text-primary shadow-lg hover:shadow-primary/20 transition-all z-[120] hover:scale-110 active:scale-95",
                            isCollapsed && "rotate-180"
                        )}
                    >
                        <ChevronLeft size={16} />
                    </button>

                    <button onClick={close} className="md:hidden p-2 text-muted-foreground hover:text-foreground absolute right-4 top-1/2 -translate-y-1/2">
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                    {visibleItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={close}
                                className={cn(
                                    "flex items-center rounded-xl transition-all duration-200 group font-medium text-sm overflow-hidden",
                                    isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3",
                                    isActive
                                        ? "bg-primary/10 text-primary font-bold shadow-sm"
                                        : "text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-foreground dark:hover:text-slate-100"
                                )}
                            >
                                <item.icon size={20} className={cn("shrink-0", isActive ? "text-primary" : "text-slate-400 group-hover:text-foreground dark:group-hover:text-slate-100")} />
                                {!isCollapsed && <span className="truncate animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>}
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-border/40 dark:border-slate-800">
                    {/* Standard User Logout Area */}
                    <div className="mt-auto">
                        {isSuperAdmin ? (
                            <button 
                                onClick={async () => {
                                    const { exitImpersonation } = await import("@/actions/superadmin");
                                    await exitImpersonation();
                                    window.location.href = "/superadmin";
                                }}
                                className="flex w-full items-center gap-3 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors font-medium text-sm"
                            >
                                <LogOut size={20} />
                                <span>Cerrar Modo Dios</span>
                            </button>
                        ) : (
                            <button 
                                onClick={async () => {
                                    const { createClient } = await import("@/lib/supabase/client");
                                    const supabase = createClient();
                                    await supabase.auth.signOut();
                                    window.location.href = "/login";
                                }}
                                className={cn(
                                    "flex items-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 rounded-xl transition-colors w-full font-medium text-sm overflow-hidden",
                                    isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
                                )}
                                title={isCollapsed ? "Cerrar Sesión" : undefined}
                            >
                                <LogOut size={20} className="shrink-0" />
                                {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">Cerrar Sesión</span>}
                            </button>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}
