import { getInventoryMovements } from "@/actions/inventory";
import { MovementsTable } from "@/components/dashboard/inventory/MovementsTable";
import { ArrowLeft, History } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function MovementsPage({
    searchParams,
}: {
    searchParams: Promise<{ productId?: string; warehouseId?: string }>;
}) {
    const sp = await searchParams;
    const productId = sp.productId;
    const warehouseId = sp.warehouseId;

    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    let role = 'staff';
    let filterWarehouseId = warehouseId;

    if (user) {
        const { data: member } = await supabaseAdmin
            .from("clinic_members")
            .select("role, clinic_id")
            .eq("user_id", user.id)
            .single();
        if (member) {
            role = member.role;
            if (role === 'vet') {
                // Forzar filtro para veterinarios
                const { data: consultingWarehouses } = await supabaseAdmin
                    .from("warehouses")
                    .select("id")
                    .eq("clinic_id", member.clinic_id)
                    .eq("type", "consulting")
                    .eq("is_active", true);

                if (consultingWarehouses && consultingWarehouses.length > 0) {
                    if (warehouseId && consultingWarehouses.some(w => w.id === warehouseId)) {
                        filterWarehouseId = warehouseId;
                    } else {
                        filterWarehouseId = consultingWarehouses[0].id;
                    }
                }
            }
        }
    }

    const movements = await getInventoryMovements(1000, productId, filterWarehouseId);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black font-heading text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400">
                            <History size={32} />
                        </div>
                        Historial de Movimientos
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Auditoría completa de entradas y salidas de inventario.</p>
                </div>

                <Link href="/dashboard/inventory">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
                        <ArrowLeft size={20} />
                        Volver al Inventario
                    </button>
                </Link>
            </div>

            <MovementsTable movements={movements as any[]} />
        </div>
    );
}
