import { Skeleton } from "@/components/ui/Skeleton";
import { Activity } from "lucide-react";

export default function HospitalLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
                        <Activity className="text-primary opacity-50" />
                        <Skeleton className="h-8 w-64" />
                    </h1>
                    <div className="mt-2">
                        <Skeleton className="h-4 w-96" />
                    </div>
                </div>
                <Skeleton className="h-10 w-full md:w-48 rounded-xl" />
            </div>

            {/* Content (Filter + Grid) */}
            <div className="space-y-6">
                <Skeleton className="h-12 w-full md:w-64 rounded-xl" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white border border-border/40 p-6 rounded-3xl space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-14 w-14 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                </div>
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </div>
                            <div className="pt-4 border-t border-border/40 space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-9 w-24 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
