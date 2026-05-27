import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/actions/superadmin";
import { SuperAdminSidebar } from "@/components/superadmin/SuperAdminSidebar";

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
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
            <SuperAdminSidebar />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
