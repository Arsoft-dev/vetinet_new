import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/actions/superadmin";
import Link from "next/link";
import { ShieldCheck, Building2, LayoutDashboard } from "lucide-react";
import { SuperAdminLogout } from "@/components/superadmin/LogoutButton";

export default async function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const isSA = await isSuperAdmin();
    
    if (!isSA) {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex">
            {/* SA Sidebar */}
            <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
                <div className="h-20 flex items-center justify-center border-b border-slate-800">
                    <div className="flex items-center gap-2 text-indigo-400">
                        <ShieldCheck size={28} />
                        <span className="font-black text-xl tracking-widest uppercase">Super Admin</span>
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/superadmin" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors text-sm font-bold text-slate-300 hover:text-white">
                        <LayoutDashboard size={20} />
                        Dashboard
                    </Link>
                    <Link href="/superadmin/clinics" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors text-sm font-bold text-slate-300 hover:text-white">
                        <Building2 size={20} />
                        Clínicas
                    </Link>
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <SuperAdminLogout />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
