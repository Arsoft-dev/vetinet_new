import { getInventoryMovements } from "@/actions/inventory";
import { MovementsTable } from "@/components/dashboard/inventory/MovementsTable";
import { ArrowLeft, History } from "lucide-react";
import Link from "next/link";

export default async function MovementsPage({
    searchParams,
}: {
    searchParams: Promise<{ productId?: string }>;
}) {
    const sp = await searchParams;
    const productId = sp.productId;

    const movements = await getInventoryMovements(1000, productId);

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
