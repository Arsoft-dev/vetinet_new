import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { DashboardLayoutWrapper } from "@/components/dashboard/wrappers/DashboardLayoutWrapper";
import { MainContent } from "@/components/dashboard/wrappers/MainContent";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSuperAdmin, getActiveAnnouncement } from "@/actions/superadmin";
import { RealtimeBanner } from "@/components/dashboard/RealtimeBanner";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    let isSA = false;
    let role = 'staff';
    
    let clinicConfig = { billing_enabled: true };
    
    if (user) {
        isSA = await isSuperAdmin();
        const { data: member } = await supabaseAdmin
            .from("clinic_members")
            .select("status, role, clinics(subscription_status, billing_enabled)")
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
            
            if (clinic) {
                clinicConfig.billing_enabled = clinic.billing_enabled ?? true;
                
                if (clinic.subscription_status === 'suspended') {
                    await supabase.auth.signOut();
                    redirect("/login?error=clinic_suspended");
                }
            }
            
            if (member.status === 'inactive') {
                await supabase.auth.signOut();
                redirect("/login?error=account_suspended");
            }
        }
    }

    const activeMessage = await getActiveAnnouncement();

    return (
        <DashboardLayoutWrapper>
            <div className="min-h-screen bg-background transition-colors duration-300">
                <Sidebar userRole={role} isSuperAdmin={isSA} clinicConfig={clinicConfig} />

                <MainContent>
                    <Header />
                    
                    {/* System Announcement Banner (Realtime) */}
                    <RealtimeBanner initialMessage={activeMessage} />

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
