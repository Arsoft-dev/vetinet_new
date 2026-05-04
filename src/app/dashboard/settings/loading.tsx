import { Skeleton } from "@/components/ui/Skeleton";

export default function SettingsLoading() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black font-heading text-slate-900 tracking-tight">
                        <Skeleton className="h-10 w-64" />
                    </h1>
                    <div className="mt-2">
                        <Skeleton className="h-5 w-96" />
                    </div>
                </div>
            </div>

            <div className="flex gap-8">
                {/* Sidebar Navigation Skeleton */}
                <div className="w-64 shrink-0 hidden md:block space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-border/40">
                            <Skeleton className="h-5 w-5 rounded-md" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    ))}
                </div>

                {/* Content Area Skeleton */}
                <div className="flex-1 bg-white border border-border/40 rounded-3xl p-8 space-y-8">
                    <div>
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-4 w-72" />
                    </div>
                    
                    <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-12 w-full max-w-md rounded-xl" />
                            </div>
                        ))}
                    </div>

                    <div className="pt-6 border-t border-border/40">
                        <Skeleton className="h-12 w-32 rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}
