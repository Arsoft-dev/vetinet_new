import { Skeleton } from "@/components/ui/Skeleton";
import { Stethoscope } from "lucide-react";

export default function ConsultationsLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
                        <Stethoscope className="text-primary opacity-50" />
                        <Skeleton className="h-8 w-64" />
                    </h1>
                    <div className="mt-2">
                        <Skeleton className="h-4 w-96" />
                    </div>
                </div>
            </div>

            {/* List with Search Integration */}
            <div className="space-y-4">
                <Skeleton className="h-12 w-full md:w-1/3 rounded-xl" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-border/40 bg-white">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                            <Skeleton className="h-8 w-24 rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
