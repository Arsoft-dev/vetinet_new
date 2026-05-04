import { Skeleton } from "@/components/ui/Skeleton";
import { CalendarDays } from "lucide-react";

export default function CalendarLoading() {
    return (
        <div className="h-[calc(100vh-120px)] flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
                        <CalendarDays className="text-primary opacity-50" />
                        <Skeleton className="h-8 w-48" />
                    </h1>
                    <div className="mt-2">
                        <Skeleton className="h-4 w-72" />
                    </div>
                </div>
            </div>

            {/* Calendar View Skeleton */}
            <div className="flex-1 bg-white rounded-3xl border border-border/40 shadow-sm overflow-hidden p-6 flex flex-col gap-6">
                {/* Calendar Toolbar Skeleton */}
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-24 rounded-xl" />
                        <Skeleton className="h-10 w-24 rounded-xl" />
                    </div>
                    <Skeleton className="h-10 w-48 rounded-xl" />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-20 rounded-xl" />
                        <Skeleton className="h-10 w-20 rounded-xl" />
                        <Skeleton className="h-10 w-20 rounded-xl" />
                    </div>
                </div>

                {/* Calendar Grid Skeleton */}
                <div className="flex-1 border border-border/40 rounded-2xl overflow-hidden flex flex-col">
                    <div className="grid grid-cols-7 border-b border-border/40 bg-slate-50/50 p-3">
                        {[...Array(7)].map((_, i) => (
                            <Skeleton key={i} className="h-4 w-12 mx-auto" />
                        ))}
                    </div>
                    <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-px bg-border/40">
                        {[...Array(35)].map((_, i) => (
                            <div key={i} className="bg-white p-2">
                                <Skeleton className="h-4 w-6 mb-2" />
                                {i % 5 === 0 && <Skeleton className="h-6 w-full rounded-md" />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
