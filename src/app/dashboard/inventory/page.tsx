import { getProducts, getInventoryStats } from "@/actions/inventory";
import InventoryDashboard from "@/components/dashboard/inventory/InventoryDashboard";
import { isBillingEnabled } from "@/actions/clinic-actions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function InventoryPage() {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    let role = "staff";
    let clinicId = "";
    
    if (user) {
        const { data: member } = await supabaseAdmin
            .from("clinic_members")
            .select("role, clinic_id")
            .eq("user_id", user.id)
            .single();
        if (member) {
            role = member.role;
            clinicId = member.clinic_id;
        }
    }

    let filterWarehouseId: string | undefined = undefined;
    if (role === 'vet' && clinicId) {
        const { data: consultingWarehouses } = await supabaseAdmin
            .from("warehouses")
            .select("id")
            .eq("clinic_id", clinicId)
            .eq("type", "consulting")
            .eq("is_active", true);
            
        if (consultingWarehouses && consultingWarehouses.length > 0) {
            filterWarehouseId = consultingWarehouses[0].id;
        }
    }

    // 1. Fetch data concurrently
    const [products, stats, billingEnabled] = await Promise.all([
        getProducts("", filterWarehouseId),
        getInventoryStats(filterWarehouseId),
        isBillingEnabled()
    ]);

    return (
        <div className="max-w-7xl mx-auto">
            <InventoryDashboard
                initialProducts={products}
                stats={stats}
                billingEnabled={billingEnabled}
                userRole={role}
            />
        </div>
    );
}
