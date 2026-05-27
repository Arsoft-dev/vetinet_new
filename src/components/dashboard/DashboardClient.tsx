"use client";

import React from 'react';
import { 
    Users, Calendar, DollarSign, Activity, Clock, 
    ChevronRight, ArrowUpRight, TrendingUp, CreditCard, 
    Package, BarChart3, PieChart as PieChartIcon
} from "lucide-react";
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, PieChart, Pie, Cell, BarChart, 
    Bar, Legend 
} from 'recharts';
import { format } from "date-fns";
import Link from "next/link";
import { motion } from "framer-motion";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function DashboardClient({ data, billingEnabled }: { data: any, billingEnabled: boolean }) {
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const statsConfig = [
        { label: "Pacientes Hoy", value: data.stats.patientsToday.toString(), icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", trend: null },
        { label: "Citas Pendientes", value: data.stats.pendingAppointments.toString(), icon: Calendar, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20", trend: null },
        { label: "Total Pacientes", value: data.stats.totalPatients.toString(), icon: Users, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20", trend: null },
        ...(billingEnabled ? [{ 
            label: "Ingresos del Mes", 
            value: `$${data.stats.monthlyIncome.toLocaleString('es-VE')}`, 
            icon: DollarSign, 
            color: "text-emerald-600 dark:text-emerald-400", 
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
            trend: data.stats.incomeGrowth 
        }] : []),
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Hola, {data.vetName.split(' ')[0]} 👋
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Resumen estratégico de <span className="text-primary font-bold">{data.clinicName}</span></p>
                </motion.div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Sistema Online</span>
                    </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsConfig.map((stat, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group overflow-hidden relative"
                        title={stat.label === "Ingresos del Mes" ? `Total en BS: ${data.stats.monthlyIncomeBS.toLocaleString('es-VE')} BS` : undefined}
                    >
                        <div className="absolute -right-4 -bottom-4 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-125 transition-transform">
                            <stat.icon size={120} />
                        </div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl group-hover:scale-110 transition-transform`}>
                                <stat.icon size={24} />
                            </div>
                            {stat.trend !== null && (
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-widest ${stat.trend >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600'}`}>
                                    {stat.trend >= 0 ? '+' : ''}{stat.trend.toFixed(1)}% {stat.trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowUpRight size={12} className="rotate-90" />}
                                </span>
                            )}
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-baseline gap-1">
                                <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-1 tracking-tight">{stat.value}</h3>
                                {stat.label.includes("Ingresos") && <span className="text-xs font-bold text-slate-400">USD</span>}
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{stat.label}</p>
                            
                            {stat.label === "Ingresos del Mes" && (
                                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Equivalente en BS</span>
                                    <span className="text-[10px] font-black text-emerald-600">Bs. {data.stats.monthlyIncomeBS.toLocaleString('es-VE')}</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Area: Main Charts */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* Activity Area Chart */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-10 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                                    <BarChart3 className="text-blue-500" size={24} /> Flujo de Consultas Médicas
                                </h3>
                                <p className="text-sm text-slate-400 font-medium">Análisis de actividad semanal</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 p-2 px-4 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-100 dark:border-slate-700">Realtime Data</div>
                        </div>

                        <div className="h-[350px] w-full min-h-0">
                            {isMounted && (
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <AreaChart data={data.activityData}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                                    <XAxis 
                                        dataKey="day" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fontSize: 10, fontWeight: 'black', fill: '#64748b'}}
                                    />
                                    <YAxis hide />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', color: '#fff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#3b82f6', fontSize: '12px', fontWeight: 'bold' }}
                                        cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="count" 
                                        stroke="#3b82f6" 
                                        strokeWidth={6}
                                        fillOpacity={1} 
                                        fill="url(#colorCount)" 
                                        animationDuration={2500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                            )}
                        </div>
                    </motion.div>

                    {billingEnabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Payment Methods Distribution */}
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm flex flex-col"
                            >
                                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 tracking-tight flex items-center gap-2">
                                    <PieChartIcon className="text-emerald-500" size={20} /> Distribución de Ingresos
                                </h3>
                                <div className="h-[250px] w-full relative min-h-0">
                                    {data.paymentDistribution.length > 0 && isMounted ? (
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                            <PieChart>
                                                <Pie
                                                    data={data.paymentDistribution}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={70}
                                                    outerRadius={95}
                                                    paddingAngle={8}
                                                    dataKey="value"
                                                    animationDuration={1500}
                                                    stroke="none"
                                                >
                                                    {data.paymentDistribution.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    formatter={(value: any) => [`$${value.toLocaleString()}`, 'Total USD']}
                                                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', color: '#fff' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                                            <PieChartIcon size={48} className="mb-2" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Sin pagos registrados</p>
                                        </div>
                                    )}
                                    {data.paymentDistribution.length > 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                            <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">${data.stats.monthlyIncome.toFixed(0)}</span>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">USD TOTAL</span>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-6">
                                    {data.paymentDistribution.map((p: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">{p.name}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">${p.value.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Top Products/Services Ranking */}
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm"
                            >
                                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 tracking-tight flex items-center gap-2">
                                    <TrendingUp className="text-amber-500" size={20} /> Top Items (Ventas USD)
                                </h3>
                                <div className="space-y-5">
                                    {data.topItems.map((item: any, i: number) => (
                                        <div key={i} className="group cursor-default">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-2">
                                                <span className="text-slate-500 group-hover:text-amber-500 transition-colors truncate max-w-[150px]">{item.name}</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-slate-900 dark:text-white">${item.value.toLocaleString()}</span>
                                                    <span className="text-slate-400 opacity-50">USD</span>
                                                </div>
                                            </div>
                                            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(item.value / (data.topItems[0]?.value || 1)) * 100}%` }}
                                                    transition={{ duration: 1.5, ease: "circOut", delay: i * 0.1 }}
                                                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.2)]" 
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {data.topItems.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 py-12">
                                            <Package size={48} className="mb-2" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-center">Aún no hay ventas detalladas este mes</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </div>

                {/* Right Area: Agenda & Alerts */}
                <div className="lg:col-span-4 space-y-8">
                    
                    {/* Appointments List */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm flex flex-col h-[450px]"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600">
                                    <Clock size={20} />
                                </div>
                                Próximas Citas
                            </h3>
                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-500">{data.stats.pendingAppointments}</span>
                        </div>

                        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                            {data.upcoming.length > 0 ? data.upcoming.map((apt: any) => (
                                <div key={apt.id} className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 transition-all cursor-pointer group">
                                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center justify-center font-black text-indigo-600 shrink-0 border border-slate-100 dark:border-slate-800 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        <span className="text-sm">{format(new Date(apt.start_time), 'HH:mm')}</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-extrabold text-slate-800 dark:text-slate-200 truncate text-sm mb-0.5 uppercase italic">{apt.pet?.name || "Sin Mascota"}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{apt.reason}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                                    <Calendar className="text-slate-400 mb-4" size={48} />
                                    <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">Sin citas pendientes</p>
                                </div>
                            )}
                        </div>

                        <Link 
                            href="/dashboard/calendar"
                            className="mt-8 w-full py-4 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group"
                        >
                            Ver Agenda Completa
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>

                    {/* Operational Health Card */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-emerald-600 dark:bg-emerald-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-xl shadow-emerald-600/20"
                    >
                        <Activity className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-125 transition-transform" size={180} />
                        <h3 className="text-xl font-black mb-2 tracking-tight">Salud Operativa</h3>
                        <p className="text-emerald-100 text-sm font-medium mb-6">Tu clínica está operando al 100%.</p>
                        
                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl border border-white/10 hover:bg-white/20 transition-colors">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Activity size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Hospitalizados</p>
                                    <p className="text-lg font-black">{data.stats.hospitalized} Mascotas</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl border border-white/10 hover:bg-white/20 transition-colors">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Users size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Base de Datos</p>
                                    <p className="text-lg font-black">{data.stats.totalPatients} Pacientes</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}
