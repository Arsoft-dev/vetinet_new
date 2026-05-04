import { SettingsView } from "@/components/dashboard/settings/SettingsView";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function SettingsPage() {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    let userRole = 'staff';
    let currentUserEmail = user?.email || '';
    let currentUserName = user?.user_metadata?.full_name || '';

    if (user) {
        const { data: member } = await supabaseAdmin
            .from("clinic_members")
            .select("role")
            .eq("user_id", user.id)
            .single();
            
        if (member) userRole = member.role;
    }
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black font-heading text-slate-900 dark:text-white tracking-tight">Configuración del Sistema</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Administra los datos legales, finanzas y equipo de tu clínica.</p>
                </div>
            </div>

            <SettingsView userRole={userRole} currentUser={{ email: currentUserEmail, name: currentUserName }} />
        </div>
    );
}
