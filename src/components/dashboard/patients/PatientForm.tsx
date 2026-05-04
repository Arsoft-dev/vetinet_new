"use client";

import { useState, useEffect, useRef, useActionState } from "react";
// import { useFormState } from "react-dom"; // Deprecated in React 19
import { User, Mail, Phone, MapPin, PawPrint, Calendar, Weight, CreditCard, Save, X, Palette, Activity, ShieldCheck, Utensils, Baby } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { registerPatient } from "@/actions/register-patient";
import { searchClients } from "@/actions/search-clients";
import { Search } from "lucide-react";

const initialState = {
    success: false,
    message: "",
};

export function PatientForm() {
    // @ts-ignore
    const [state, formAction] = useActionState(registerPatient, initialState);
    const formRef = useRef<HTMLFormElement>(null);
    const [pageLoading, setPageLoading] = useState(false);
    const router = useRouter();

    // Form State (Still needed for controlled inputs like Toggle/Select interaction)
    const [formData, setFormData] = useState({
        // Owner Data
        ownerName: "",
        ownerEmail: "",
        ownerPhone: "",
        ownerDoc: "",
        ownerAddress: "",

        // Pet Data
        petName: "",
        species: "Perro",
        breed: "",
        birthDate: "",
        weight: "",
        sex: "male",
        isNeutered: false,
        color: "",

        // Anamnesis
        lastDewormingDate: "",
        lastDewormingProduct: "",
        vaccinesHistory: "",
        previousIllnesses: "",
        previousTreatments: "",
        evolutionNotes: "",
        nutrition: "",
        lastHeat: "",
        lastBirthDate: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    // Client Search Logic
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isExistingClient, setIsExistingClient] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchTerm.length > 2) {
                setIsSearching(true);
                const results = await searchClients(searchTerm);
                setSearchResults(results);
                setIsSearching(false);
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const selectClient = (client: any) => {
        setFormData(prev => ({
            ...prev,
            ownerName: client.full_name || "",
            ownerEmail: client.email || "",
            ownerPhone: client.phone || "",
            ownerDoc: client.identification_doc || "",
            ownerAddress: client.address || "",
        }));
        setSearchTerm("");
        setSearchResults([]);
        setIsExistingClient(true);
        toast.success("Cliente seleccionado. Campos bloqueados.");
    };

    const clearClientSelection = () => {
        setFormData(prev => ({
            ...prev,
            ownerName: "",
            ownerEmail: "",
            ownerPhone: "",
            ownerDoc: "",
            ownerAddress: "",
        }));
        setSearchTerm("");
        setIsExistingClient(false);
        toast.info("Formulario de cliente restablecido.");
    };

    // Click outside to close search results
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setSearchResults([]);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Effect to handle Server Action response
    useEffect(() => {
        if (state.message) {
            setPageLoading(false);
            if (state.success) {
                toast.success("¡Operación exitosa!", {
                    description: state.message,
                    className: "text-lg font-medium", // Aumentar tamaño de letra
                    duration: 4000
                });

                // Redireccionar al listado de pacientes después de un breve momento
                setTimeout(() => {
                    router.push("/dashboard/patients");
                }, 1500);
            } else {
                toast.error("Error", {
                    description: state.message,
                    className: "text-lg font-medium"
                });
            }
        }
    }, [state, router]);

    return (
        <form ref={formRef} action={formAction} className="space-y-8" onSubmit={() => setPageLoading(true)}>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* 👤 Owner Section */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-border/40 dark:border-slate-800 shadow-sm"
                >
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/40">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Datos del Propietario</h2>
                            <p className="text-sm text-muted-foreground">Información de contacto y facturación</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">

                        {/* Search Bar for Existing Clients */}
                        <div className="md:col-span-2 mb-2 relative" ref={searchRef}>
                            <div className="relative flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={18} />
                                    <input
                                        type="text"
                                        placeholder={isExistingClient ? "Cliente seleccionado (Campos bloqueados)" : "Buscar cliente registrado (Nombre, DNI o Email)..."}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        disabled={isExistingClient}
                                        className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-primary/30 dark:border-primary/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-all text-sm font-medium placeholder:text-muted-foreground/70 text-foreground ${isExistingClient ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50' : ''}`}
                                    />
                                    {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>}
                                </div>
                                {isExistingClient && (
                                    <button
                                        type="button"
                                        onClick={clearClientSelection}
                                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold text-sm flex items-center gap-2"
                                        title="Limpiar selección y desbloquear campos"
                                    >
                                        <X size={16} />
                                        Limpiar
                                    </button>
                                )}
                            </div>

                            {/* Search Results Dropdown */}
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-border dark:border-slate-800 z-50 overflow-hidden max-h-60 overflow-y-auto">
                                    {searchResults.map((client) => (
                                        <div
                                            key={client.id}
                                            onClick={() => selectClient(client)}
                                            className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-border/40 dark:border-slate-800 last:border-0 transition-colors"
                                        >
                                            <p className="font-bold text-sm text-foreground">{client.full_name}</p>
                                            <div className="flex gap-2 text-xs text-muted-foreground">
                                                <span>{client.identification_doc}</span>
                                                <span>•</span>
                                                <span>{client.email}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Hidden inputs to ensure data is submitted when fields are disabled */}
                        {isExistingClient && (
                            <>
                                <input type="hidden" name="ownerName" value={formData.ownerName} />
                                <input type="hidden" name="ownerEmail" value={formData.ownerEmail} />
                                <input type="hidden" name="ownerPhone" value={formData.ownerPhone} />
                                <input type="hidden" name="ownerDoc" value={formData.ownerDoc} />
                                <input type="hidden" name="ownerAddress" value={formData.ownerAddress} />
                            </>
                        )}

                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-sm font-bold text-foreground ml-1">Nombre Completo</label>
                            <input required name="ownerName" value={formData.ownerName} onChange={handleChange} disabled={isExistingClient} type="text" placeholder="Ej: Abraham López" className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground ${isExistingClient ? 'opacity-60 cursor-not-allowed' : ''}`} />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-foreground ml-1">ID / DNI</label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <input name="ownerDoc" value={formData.ownerDoc} onChange={handleChange} disabled={isExistingClient} type="text" placeholder="12.345.678" className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground ${isExistingClient ? 'opacity-60 cursor-not-allowed' : ''}`} />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-foreground ml-1">Teléfono</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <input required name="ownerPhone" value={formData.ownerPhone} onChange={handleChange} disabled={isExistingClient} type="tel" placeholder="+58 412..." className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground ${isExistingClient ? 'opacity-60 cursor-not-allowed' : ''}`} />
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-sm font-bold text-foreground ml-1">Correo Electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <input required name="ownerEmail" value={formData.ownerEmail} onChange={handleChange} disabled={isExistingClient} type="email" placeholder="cliente@email.com" className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground ${isExistingClient ? 'opacity-60 cursor-not-allowed' : ''}`} />
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-sm font-bold text-foreground ml-1">Dirección</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 text-muted-foreground" size={18} />
                                <textarea name="ownerAddress" value={formData.ownerAddress} onChange={handleChange} disabled={isExistingClient} rows={2} placeholder="Calle Principal, Casa #123..." className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-foreground ${isExistingClient ? 'opacity-60 cursor-not-allowed' : ''}`} />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 🐾 Pet Section */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-border/40 dark:border-slate-800 shadow-sm"
                >
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/40">
                        <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                            <PawPrint size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Datos del Paciente</h2>
                            <p className="text-sm text-muted-foreground">Ficha clínica de la mascota</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-sm font-bold text-foreground ml-1">Nombre</label>
                            <input required name="petName" value={formData.petName} onChange={handleChange} type="text" placeholder="Ej: Max" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-foreground ml-1">Especie</label>
                            <select name="species" value={formData.species} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer text-foreground">
                                <option value="Perro">🐶 Perro</option>
                                <option value="Gato">🐱 Gato</option>
                                <option value="Ave">🦜 Ave</option>
                                <option value="Exótico">🦎 Exótico</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-foreground ml-1">Raza</label>
                            <input name="breed" value={formData.breed} onChange={handleChange} type="text" placeholder="Ej: Golden Retriever" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-foreground ml-1">Fecha Nacimiento</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <input name="birthDate" value={formData.birthDate} onChange={handleChange} type="date" className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-foreground ml-1">Peso (Kg)</label>
                            <div className="relative">
                                <Weight className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <input name="weight" value={formData.weight} onChange={handleChange} type="number" step="0.1" placeholder="Ej: 12.5" className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-foreground ml-1">Sexo</label>
                            {/* Hidden inputs to pass state to Server Action */}
                            <input type="hidden" name="sex" value={formData.sex} />
                            <input type="hidden" name="isNeutered" value={String(formData.isNeutered)} />

                            <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                <button type="button" onClick={() => setFormData(p => ({ ...p, sex: 'male' }))} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.sex === 'male' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Macho ♂</button>
                                <button type="button" onClick={() => setFormData(p => ({ ...p, sex: 'female' }))} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.sex === 'female' ? 'bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Hembra ♀</button>
                            </div>
                        </div>

                        <div className="space-y-1.5 flex items-end">
                            <div className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => setFormData(p => ({ ...p, isNeutered: !p.isNeutered }))}>
                                <span className="text-sm font-bold text-foreground">¿Esterilizado?</span>
                                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${formData.isNeutered ? 'bg-primary' : 'bg-slate-300'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${formData.isNeutered ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-1.5 pt-2">
                            <label className="text-sm font-bold text-foreground ml-1">Color / Señas Particulares</label>
                            <div className="relative">
                                <Palette className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <input name="color" value={formData.color} onChange={handleChange} type="text" placeholder="Ej: Blanco con manchas negras en el lomo" className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* 📋 Anamnesis Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-border/40 dark:border-slate-800 shadow-sm"
            >
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/40">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Anamnesis</h2>
                        <p className="text-sm text-muted-foreground">Antecedentes y estado previo del paciente</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Desparasitación */}
                    <div className="space-y-4 p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                            <ShieldCheck size={16} /> Desparasitación
                        </h3>
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">Última Fecha</label>
                                <input name="lastDewormingDate" value={formData.lastDewormingDate} onChange={handleChange} type="date" className="w-full px-3 py-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">Producto Usado</label>
                                <input name="lastDewormingProduct" value={formData.lastDewormingProduct} onChange={handleChange} type="text" placeholder="Ej. Drontal" className="w-full px-3 py-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground" />
                            </div>
                        </div>
                    </div>

                    {/* Historia Reproductiva (Solo si es hembra) */}
                    <div className={`space-y-4 p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 transition-opacity ${formData.sex === 'male' ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                        <h3 className="text-sm font-bold text-pink-600 flex items-center gap-2">
                            <Baby size={16} /> Historia Reproductiva
                        </h3>
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">Último Celo</label>
                                <input name="lastHeat" value={formData.lastHeat} onChange={handleChange} type="date" className="w-full px-3 py-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">Fecha Último Parto</label>
                                <input name="lastBirthDate" value={formData.lastBirthDate} onChange={handleChange} type="date" className="w-full px-3 py-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground" />
                            </div>
                        </div>
                    </div>

                    {/* Alimentación */}
                    <div className="space-y-4 p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-bold text-green-600 flex items-center gap-2">
                            <Utensils size={16} /> Alimentación
                        </h3>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground">Tipo / Marca de Alimento</label>
                            <textarea name="nutrition" value={formData.nutrition} onChange={handleChange} rows={3} placeholder="Ej. Perrarina ProPlan Cachorro, 3 veces al día..." className="w-full px-3 py-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none text-foreground" />
                        </div>
                    </div>

                    {/* Otros Antecedentes (Textareas largos) */}
                    <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-foreground">Vacunas Previas</label>
                            <textarea name="vaccinesHistory" value={formData.vaccinesHistory} onChange={handleChange} rows={2} placeholder="Indique vacunas aplicadas anteriormente..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none text-foreground" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-foreground">Enfermedades Anteriores</label>
                            <textarea name="previousIllnesses" value={formData.previousIllnesses} onChange={handleChange} rows={2} placeholder="Cirugías, fracturas, enfermedades crónicas..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none text-foreground" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-foreground">Tratamientos Médicos</label>
                            <textarea name="previousTreatments" value={formData.previousTreatments} onChange={handleChange} rows={2} placeholder="Tratamientos que esté recibiendo actualmente..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none text-foreground" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-foreground">Evolución / Observaciones</label>
                            <textarea name="evolutionNotes" value={formData.evolutionNotes} onChange={handleChange} rows={2} placeholder="Notas sobre el temperamento o evolución general..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none text-foreground" />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t border-border/40">
                <Link href="/dashboard/patients">
                    <button type="button" className="px-6 py-3 rounded-xl font-bold text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-colors flex items-center gap-2">
                        <X size={20} />
                        Cancelar
                    </button>
                </Link>
                <button type="submit" disabled={pageLoading} className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 hover:-translate-y-0.5 shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                    {pageLoading ? (
                        <>Guardando...</>
                    ) : (
                        <>
                            <Save size={20} />
                            Guardar Paciente
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
