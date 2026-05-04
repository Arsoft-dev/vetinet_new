import { getDashboardStats } from "@/actions/dashboard";
import { syncExchangeRate } from "@/actions/exchange-rates";
import { checkInventoryAlerts } from "@/actions/inventory-alerts";
import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
    // 1. Sync critical data (Tasa BCV + Alertas Inventario)
    await Promise.all([
        syncExchangeRate(),
        checkInventoryAlerts()
    ]);

    const data = await getDashboardStats();

    if (!data) return (
        <div className="flex items-center justify-center h-screen text-muted-foreground font-bold">
            Cargando datos reales...
        </div>
    );

    return <DashboardClient data={data} />;
}
