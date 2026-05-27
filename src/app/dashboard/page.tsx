import { getDashboardStats } from "@/actions/dashboard";
import { syncExchangeRate } from "@/actions/exchange-rates";
import { checkInventoryAlerts } from "@/actions/inventory-alerts";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
    // 1. Get clinic billing configuration first to optimize loading
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    let billingEnabled = true;

    if (user) {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const supabaseAdmin = createAdminClient();
        const { data: member } = await supabaseAdmin
            .from("clinic_members")
            .select("clinics(billing_enabled)")
            .eq("user_id", user.id)
            .single();
        
        if (member) {
            billingEnabled = (member.clinics as any)?.billing_enabled ?? true;
        }
    }

    // 2. Sync critical data (Tasa BCV + Alertas Inventario)
    // Only sync exchange rate if billing is enabled
    await Promise.all([
        billingEnabled ? syncExchangeRate() : Promise.resolve(),
        checkInventoryAlerts()
    ]);

    const data = await getDashboardStats();

    if (!data) return (
        <div className="flex items-center justify-center h-screen text-muted-foreground font-bold">
            Cargando datos reales...
        </div>
    );

    return <DashboardClient data={data} billingEnabled={billingEnabled} />;
}
