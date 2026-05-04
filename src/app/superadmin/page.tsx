import { getGlobalMetrics } from "@/actions/superadmin";
import { Building2, Users, DollarSign, Activity, Megaphone } from "lucide-react";
import { SaaSGrowthChart } from "@/components/superadmin/SaaSGrowthChart";
import { BroadcastForm } from "@/components/superadmin/BroadcastForm";

export default async function SuperAdminDashboard() {
    const res = await getGlobalMetrics();
    const metrics = res.success ? res.metrics : { totalClinics: 0, activeClinics: 0, totalPatients: 0, currentMonthRevenue: 0 };

    const statCards = [
        { title: "Total Clínicas", value: metrics?.totalClinics, icon: Building2, color: "text-indigo-400", bg: "bg-indigo-400/10" },
        { title: "Clínicas Activas", value: metrics?.activeClinics, icon: Activity, color: "text-emerald-400", bg: "bg-emerald-400/10" },
        { title: "Pacientes en Red", value: metrics?.totalPatients, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
        { title: "Ingresos Mes (Aprox)", value: `$${metrics?.currentMonthRevenue?.toFixed(2)}`, icon: DollarSign, color: "text-amber-400", bg: "bg-amber-400/10" }
    ];

    const growthData = [
        { month: 'Oct', value: 1 },
        { month: 'Nov', value: 2 },
        { month: 'Dic', value: 2 },
        { month: 'Ene', value: 4 },
        { month: 'Feb', value: 6 },
        { month: 'Mar', value: 8 },
        { month: 'Abr', value: metrics?.totalClinics || 10 },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black tracking-tight">SaaS Dashboard</h1>
                <p className="text-slate-400 mt-2">Visión global de VetiNet.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
                        <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                            <stat.icon size={24} />
                        </div>
                        <p className="text-sm font-bold text-slate-400">{stat.title}</p>
                        <h3 className="text-3xl font-black text-white mt-1">{stat.value}</h3>
                        
                        <div className={`absolute -right-6 -bottom-6 opacity-5 ${stat.color}`}>
                            <stat.icon size={100} />
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8">
                    <h2 className="text-xl font-bold text-white mb-2">Crecimiento de Clínicas</h2>
                    <p className="text-sm text-slate-400 mb-6">Nuevos registros por mes</p>
                    <SaaSGrowthChart data={growthData} />
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                            <Megaphone size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Anuncio Global</h2>
                            <p className="text-xs text-slate-500">Enviar a todas las clínicas</p>
                        </div>
                    </div>
                    
                    <BroadcastForm />
                </div>
            </div>
        </div>
    );
}
