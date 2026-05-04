import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { DashboardLayoutWrapper } from "@/components/dashboard/wrappers/DashboardLayoutWrapper";
import { MainContent } from "@/components/dashboard/wrappers/MainContent";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    const { isSuperAdmin } = await import("@/actions/superadmin");
    let isSA = false;
    let role = 'staff';
    
    if (user) {
        isSA = await isSuperAdmin();
        const { data: member } = await supabaseAdmin
            .from("clinic_members")
            .select("status, role, clinics(subscription_status)")
            .eq("user_id", user.id)
            .single();

        // Check if superadmin AND not currently impersonating (no member record)
        if (!member) {
            if (isSA) {
                redirect("/superadmin");
            }
        }
            
        if (member) {
            role = member.role;
            const clinic = member.clinics as any;
            
            if (clinic && clinic.subscription_status === 'suspended') {
                await supabase.auth.signOut();
                redirect("/login?error=clinic_suspended");
            }
            
            if (member.status === 'inactive') {
                await supabase.auth.signOut();
                redirect("/login?error=account_suspended");
            }
        }
    }

    const { getActiveAnnouncement } = await import("@/actions/superadmin");
    const activeMessage = await getActiveAnnouncement();

    const AnnouncementBanner = activeMessage ? (
        <div className="bg-indigo-500 text-white text-sm font-bold text-center px-4 py-3 shadow-md flex items-center justify-center gap-2">
            <span className="animate-pulse">🔔</span>
            {activeMessage}
        </div>
    ) : null;

    return (
        <DashboardLayoutWrapper>
            <div className="min-h-screen bg-background transition-colors duration-300">
                <Sidebar userRole={role} isSuperAdmin={isSA} />

                <MainContent>
                    <Header />
                    
                    {/* System Announcement Banner */}
                    {AnnouncementBanner}

                    <main className="flex-1 p-8 print:p-0">
                        <div className="max-w-7xl mx-auto print:max-w-none">
                            {children}
                        </div>
                    </main>
                </MainContent>
            </div>
        </DashboardLayoutWrapper>
    );
}
