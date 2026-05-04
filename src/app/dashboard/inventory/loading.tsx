import { Skeleton } from "@/components/ui/Skeleton";
import { Plus, Download } from "lucide-react";

export default function InventoryLoading() {
    return (
        <div className="space-y-6">
            {/* Page Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-extrabold text-foreground">Inventario</h1>
                    <p className="text-muted-foreground">Gestiona tus productos y existencias.</p>
                </div>
                <div className="flex gap-2">
                    <button disabled className="bg-slate-100 text-slate-400 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2">
                        <Download size={20} />
                        Reporte
                    </button>
                    <button disabled className="bg-primary/50 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2">
                        <Plus size={20} />
                        Nuevo Producto
                    </button>
                </div>
            </div>

            {/* Dashboard Skeleton */}
            <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6 space-y-6">
                <div className="flex gap-4">
                    <Skeleton className="h-12 flex-1 rounded-xl" />
                    <Skeleton className="h-12 w-32 rounded-xl" />
                </div>
                
                <div className="hidden md:block">
                    <div className="border border-border/50 rounded-xl overflow-hidden">
                        <div className="bg-slate-50 border-b border-border/50 p-4 flex gap-4">
                            <Skeleton className="h-4 flex-1" />
                            <Skeleton className="h-4 flex-1" />
                            <Skeleton className="h-4 flex-1" />
                        </div>
                        <div className="divide-y divide-border/50">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="p-4 flex gap-4">
                                    <Skeleton className="h-6 flex-1" />
                                    <Skeleton className="h-6 flex-1" />
                                    <Skeleton className="h-6 flex-1" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="md:hidden space-y-4">
                     {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="border border-border/50 p-4 rounded-xl space-y-3">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <div className="flex justify-between">
                                <Skeleton className="h-8 w-20 rounded-lg" />
                                <Skeleton className="h-8 w-20 rounded-lg" />
                            </div>
                        </div>
                     ))}
                </div>
            </div>
        </div>
    );
}
