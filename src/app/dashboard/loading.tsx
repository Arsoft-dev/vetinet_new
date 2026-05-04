import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>

            {/* Quick Actions Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-24 rounded-2xl" />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Skeleton */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Alerts Skeleton */}
                    <Skeleton className="h-24 w-full rounded-2xl" />

                    {/* Stats Grid Skeleton */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-28 rounded-2xl" />
                        ))}
                    </div>

                    {/* Pending Consultations Skeleton */}
                    <div className="bg-white p-6 rounded-3xl border border-border/50">
                        <Skeleton className="h-6 w-48 mb-6" />
                        <div className="space-y-4">
                            {[1, 2].map((i) => (
                                <Skeleton key={i} className="h-20 w-full rounded-xl" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Content Skeleton */}
                <div className="space-y-6">
                    {/* Daily Schedule Skeleton */}
                    <div className="bg-white p-6 rounded-3xl border border-border/50">
                        <Skeleton className="h-6 w-40 mb-6" />
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex gap-4">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
