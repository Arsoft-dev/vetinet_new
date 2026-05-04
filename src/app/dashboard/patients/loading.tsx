import { Skeleton } from "@/components/ui/Skeleton";
import { Plus } from "lucide-react";

export default function PatientsLoading() {
    return (
        <div className="space-y-6">
            {/* Page Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-extrabold text-foreground">Pacientes</h1>
                    <p className="text-muted-foreground">Gestiona los expedientes clínicos de tus mascotas.</p>
                </div>
                <button disabled className="bg-primary/50 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2">
                    <Plus size={20} />
                    Nuevo Paciente
                </button>
            </div>

            {/* Search Component Skeleton */}
            <div className="flex gap-2">
                <Skeleton className="h-12 flex-1 rounded-xl" />
            </div>

            {/* Patients List Skeleton */}
            <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-border/50 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <Skeleton className="w-16 h-16 rounded-2xl flex-shrink-0" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-5 w-32" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            </div>
                        </div>
                        <div className="flex w-full md:w-auto items-center gap-2">
                            <Skeleton className="h-10 w-24 rounded-xl" />
                            <Skeleton className="h-10 w-10 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
