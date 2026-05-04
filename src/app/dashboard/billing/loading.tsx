import { Skeleton } from "@/components/ui/Skeleton";
import { Receipt, TrendingUp, Wallet, Banknote } from "lucide-react";

export default function BillingLoading() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black font-heading text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600 opacity-50">
                            <Receipt size={32} />
                        </div>
                        <Skeleton className="h-10 w-48" />
                    </h1>
                    <div className="mt-2">
                        <Skeleton className="h-5 w-72" />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-40 rounded-xl" />
                    <Skeleton className="h-12 w-36 rounded-xl" />
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[TrendingUp, Banknote, Wallet].map((Icon, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-border/40 shadow-sm flex items-center gap-4">
                        <div className="p-4 bg-slate-100 text-slate-400 rounded-2xl">
                            <Icon size={28} />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-32" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Invoices Table */}
            <div className="bg-white rounded-3xl border border-border/40 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-5 w-20" />
                </div>

                {/* MOBILE VIEW (CARD LIST) */}
                <div className="lg:hidden divide-y divide-slate-100">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-6 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <Skeleton className="h-5 w-24" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                                <Skeleton className="h-5 w-16 rounded-lg" />
                            </div>
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <div className="space-y-1 flex flex-col items-end">
                                    <Skeleton className="h-6 w-24" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* DESKTOP VIEW (TABLE) */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50/50">
                            <tr>
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <th key={i} className="px-6 py-4">
                                        <Skeleton className="h-3 w-20" />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <tr key={i}>
                                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                                    <td className="px-6 py-4 space-y-1">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-24" />
                                    </td>
                                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-lg" /></td>
                                    <td className="px-6 py-4 flex flex-col items-end space-y-1">
                                        <Skeleton className="h-5 w-24" />
                                        <Skeleton className="h-3 w-16" />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Skeleton className="h-10 w-10 rounded-xl ml-auto" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
