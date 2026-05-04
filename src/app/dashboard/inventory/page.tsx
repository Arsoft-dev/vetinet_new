import { getProducts, getInventoryStats } from "@/actions/inventory";
import InventoryDashboard from "@/components/dashboard/inventory/InventoryDashboard";

export default async function InventoryPage() {
    // 1. Fetch data concurrently
    const [products, stats] = await Promise.all([
        getProducts(),
        getInventoryStats()
    ]);

    return (
        <div className="max-w-7xl mx-auto">
            <InventoryDashboard
                initialProducts={products}
                stats={stats}
            />
        </div>
    );
}
