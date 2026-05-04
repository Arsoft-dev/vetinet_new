"use client";

import { useState } from "react";
import { Search, User, ArrowRight, PawPrint } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Pet {
    id: string;
    name: string;
    species: string;
    breed: string;
    avatar_url: string | null;
    clients: {
        full_name: string;
        phone: string | null;
    } | null;
}

export function ConsultationPatientList({ initialPets }: { initialPets: Pet[] }) {
    const [search, setSearch] = useState("");

    const filteredPets = initialPets.filter(pet => 
        pet.name.toLowerCase().includes(search.toLowerCase()) ||
        pet.clients?.full_name.toLowerCase().includes(search.toLowerCase()) ||
        pet.breed?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative group max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por nombre de mascota, dueño o raza..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-border/40 dark:border-slate-800 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-lg text-foreground"
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredPets.map((pet, index) => (
                        <motion.div
                            key={pet.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: index * 0.05 }}
                            className="group bg-white dark:bg-slate-900 rounded-3xl border border-border/40 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden flex flex-col"
                        >
                            {/* Card Content */}
                            <div className="p-6 flex-1 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl shadow-inner group-hover:bg-primary/10 transition-colors shrink-0 overflow-hidden">
                                        {pet.avatar_url ? (
                                            <img src={pet.avatar_url} className="w-full h-full object-cover" alt={pet.name} />
                                        ) : (
                                            <span>{pet.species === "Gato" ? "🐱" : pet.species === "Ave" ? "🦜" : "🐶"}</span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{pet.name}</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{pet.breed || "Raza no especificada"}</p>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                                        <User size={14} className="text-slate-400" />
                                        <span className="font-medium truncate">{pet.clients?.full_name || "Sin Dueño"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer / Action */}
                            <Link 
                                href={`/dashboard/patients/${pet.id}/new-consultation`}
                                className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-border/20 dark:border-slate-800 group-hover:bg-primary dark:group-hover:bg-primary transition-colors flex items-center justify-between"
                            >
                                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-white transition-colors">Atender ahora</span>
                                <div className="p-1.5 bg-white dark:bg-slate-900 rounded-lg text-primary shadow-sm">
                                    <ArrowRight size={16} />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filteredPets.length === 0 && (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <div className="bg-white dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <PawPrint className="text-slate-300" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-600">No se encontraron mascotas</h3>
                    <p className="text-slate-400">Intenta con otro término de búsqueda.</p>
                </div>
            )}
        </div>
    );
}
