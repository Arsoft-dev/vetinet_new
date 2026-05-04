"use client";

import { motion } from "framer-motion";

export function SaaSGrowthChart({ data }: { data: { month: string, value: number }[] }) {
    const maxValue = Math.max(...data.map(d => d.value), 10); // Minimum scale of 10

    return (
        <div className="h-64 flex items-end gap-2 pt-8">
            {data.map((item, i) => {
                const heightPercentage = (item.value / maxValue) * 100;
                
                return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="relative w-full flex justify-center h-full items-end">
                            {/* Tooltip */}
                            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-xl whitespace-nowrap z-10 pointer-events-none">
                                {item.value} Clínicas
                            </div>
                            
                            {/* Bar */}
                            <motion.div 
                                initial={{ height: 0 }}
                                animate={{ height: `${heightPercentage}%` }}
                                transition={{ duration: 1, delay: i * 0.1, type: "spring", stiffness: 50 }}
                                className="w-full max-w-[40px] bg-indigo-500/20 group-hover:bg-indigo-500 rounded-t-sm border-t-2 border-indigo-500 transition-colors"
                            />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.month}</span>
                    </div>
                );
            })}
        </div>
    );
}
