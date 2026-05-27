"use client";

import { useActionState } from "react"; // or "react-dom" depending on version, usually react in Next 15
import { saveConsultation } from "@/actions/save-consultation";
import { Save, X, Activity, ClipboardList, Stethoscope, Thermometer, Heart, Wind, Zap, Beaker, FileText, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ConsultationInventoryManager } from "@/components/dashboard/inventory/ConsultationInventoryManager";
import { getProtocols } from "@/actions/get-protocols";
import { motion, AnimatePresence } from "framer-motion";

// Hook polyfill if needed for older Next versions, but Next 14/15 uses react definition.
// using simpler useFormState pattern from react-dom if standard hook fails, 
// but let's assume standard useActionState/useFormState availability.
import { useFormStatus } from "react-dom";

function SubmitButtons({ billingEnabled }: { billingEnabled: boolean }) {
    const { pending } = useFormStatus();
    return (
        <div className="flex flex-col sm:flex-row gap-3">
            <button
                type="submit"
                disabled={pending}
                className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 border ${!billingEnabled ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 border-transparent w-full sm:w-auto' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'}`}
            >
                <Save size={20} />
                {pending ? "Guardando..." : "Guardar Historial"}
            </button>
            
            {billingEnabled && (
                <button
                    type="submit"
                    name="sendToBilling"
                    value="true"
                    disabled={pending}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                    <FileText size={20} />
                    {pending ? "Enviando..." : "Finalizar y Cobrar"}
                </button>
            )}
        </div>
    );
}

export function ConsultationForm({ petId, petName, billingEnabled = true }: { petId: string, petName: string, billingEnabled?: boolean }) {
    // Bind the petId to the server action
    const saveWithId = saveConsultation.bind(null, petId);

    // @ts-ignore: React 19 / Next 14+ hook signature
    const [state, formAction] = useActionState(saveWithId, {
        success: false,
        message: ""
    });

    // Protocols State
    const [protocols, setProtocols] = useState<any[]>([]);
    const [planText, setPlanText] = useState("");
    const [isProtocolsOpen, setIsProtocolsOpen] = useState(false);

    useEffect(() => {
        const fetchProtocols = async () => {
            const data = await getProtocols();
            setProtocols(data);
        };
        fetchProtocols();
    }, []);

    const applyProtocol = (protocol: any) => {
        let text = `--- ${protocol.name.toUpperCase()} ---\n`;
        if (protocol.description) text += `${protocol.description}\n\n`;
        if (protocol.items && Array.isArray(protocol.items)) {
            protocol.items.forEach((item: any) => {
                text += `• ${item.action}${item.note ? ': ' + item.note : ''}\n`;
            });
        }
        setPlanText(prev => prev + (prev ? '\n\n' : '') + text);
        setIsProtocolsOpen(false);
    };

    const systems = [
        { id: "body_condition", label: "1. Estado General y Condición Corporal" },
        { id: "hydration_status", label: "2. Estado de Hidratación" },
        { id: "integumentary_system", label: "3. Sistema Tegumentario" },
        { id: "eyes_system", label: "4. Ojos" },
        { id: "ears_system", label: "5. Oídos" },
        { id: "nose_system", label: "6. Nariz" },
        { id: "digestive_system", label: "7. Sistema Digestivo" },
        { id: "respiratory_system", label: "8. Sistema Respiratorio" },
        { id: "nervous_system", label: "9. Sistema Nervioso" },
        { id: "musculoskeletal_system", label: "10. Sistema Musculoesquelético" },
        { id: "cardiovascular_system", label: "11. Sistema Cardiovascular" },
        { id: "genitourinary_system", label: "12. Sistema Genitourinario" },
    ];

    return (
        <form action={formAction} className="space-y-6">

            {/* Error/Success Message */}
            {state?.message && !state.success && (
                <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-medium">
                    {state.message}
                </div>
            )}

            {/* Vitals & Physical Exam Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Vitals Card */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-border/40 dark:border-slate-800 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-border/10">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <Activity size={20} />
                        </div>
                        <h3 className="font-bold text-lg text-foreground">Signos Vitales</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Peso (kg)</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="number" step="0.01" name="weight" placeholder="0.00" className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm text-foreground" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Temp (°C)</label>
                            <div className="relative">
                                <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="number" step="0.1" name="temperature" placeholder="38.5" className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm text-foreground" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">F. Resp (rpm)</label>
                            <div className="relative">
                                <Wind className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="number" name="respiratory_rate" placeholder="24" className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm text-foreground" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">F. Card (lpm)</label>
                            <div className="relative">
                                <Heart className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="number" name="heart_rate" placeholder="80" className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm text-foreground" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Pulso / TLLC</label>
                            <div className="grid grid-cols-2 gap-3">
                                <input name="pulse" placeholder="Pulso..." className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground" />
                                <input name="tllc" placeholder="TLLC..." className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Ganglios / Mucosas</label>
                            <div className="grid grid-cols-2 gap-3">
                                <input name="lymph_nodes" placeholder="Ganglios..." className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground" />
                                <input name="mucosas" placeholder="Mucosas..." className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Actitud y Temperamento</label>
                            <select name="attitude" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground">
                                <option value="Alerta">Alerta</option>
                                <option value="Letárgico">Letárgico</option>
                                <option value="Estuporoso">Estuporoso</option>
                                <option value="Comatoso">Comatoso</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Systems Review Card */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-border/40 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 pb-4 border-b border-border/10">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                            <Stethoscope size={20} />
                        </div>
                        <h3 className="font-bold text-lg text-foreground">Revisión por Sistemas</h3>
                        <div className="ml-auto flex gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> Normal</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Anormal</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300" /> No Eval.</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 pt-4">
                        {systems.map((sys) => (
                            <div key={sys.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                <span className="text-xs font-bold text-slate-600 truncate mr-2">{sys.label}</span>
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                                    {['N', 'AN', 'NE'].map((opt) => (
                                        <label key={opt} className="cursor-pointer group">
                                            <input type="radio" name={sys.id} value={opt} defaultChecked={opt === 'N'} className="hidden" />
                                            <div className={`px-2 py-0.5 text-[10px] font-black rounded-md transition-all
                                                group-has-[:checked]:bg-white dark:group-has-[:checked]:bg-slate-700 group-has-[:checked]:shadow-sm
                                                ${opt === 'N' ? 'text-green-600 group-has-[:checked]:text-green-600' : ''}
                                                ${opt === 'AN' ? 'text-red-600 group-has-[:checked]:text-red-600' : ''}
                                                ${opt === 'NE' ? 'text-slate-500 group-has-[:checked]:text-slate-700' : ''}
                                            `}>
                                                {opt}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Simplified Consultation Section */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border/40 dark:border-slate-800 shadow-sm space-y-6">
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700 ml-1">Motivo de la Consulta</label>
                    <input
                        type="text"
                        name="reason"
                        required
                        placeholder="Ej. Vómitos y diarrea desde ayer..."
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-foreground"
                    />
                </div>

                {/* 1. Symptoms & Findings */}
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-blue-600 ml-1">Síntomas y Hallazgos (Lo que ves)</label>
                    <textarea
                        name="subjective"
                        rows={4}
                        placeholder="Describe los síntomas y lo encontrado en el examen físico..."
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium resize-none text-foreground"
                    />
                    {/* Hidden objective field for backward compatibility */}
                    <input type="hidden" name="objective" value="" />
                </div>

                {/* 2. Diagnosis */}
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-orange-600 ml-1">Diagnóstico (Lo que tiene)</label>
                    <textarea
                        name="assessment"
                        rows={2}
                        placeholder="Diagnóstico presuntivo o definitivo..."
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium resize-none text-foreground"
                    />
                </div>

                {/* 3. Treatment & Plan */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-purple-600 ml-1 flex items-center gap-2">
                            <Zap size={16} /> Plan y Tratamiento (Lo que haremos)
                        </label>
                        
                        {/* Protocol Selector */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsProtocolsOpen(!isProtocolsOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors border border-purple-100 shadow-sm"
                            >
                                <ClipboardList size={14} />
                                {protocols.length > 0 ? "Usar Protocolo" : "No hay protocolos"}
                                <ChevronDown size={14} className={`transition-transform ${isProtocolsOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            <AnimatePresence>
                                {isProtocolsOpen && protocols.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        className="absolute right-0 bottom-full mb-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-border overflow-hidden z-[60]"
                                    >
                                        <div className="p-2 border-b border-slate-50 bg-slate-50/50">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Selecciona Una Plantilla</p>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto p-1">
                                            {protocols.map((p) => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => applyProtocol(p)}
                                                    className="w-full text-left p-3 hover:bg-purple-50 rounded-lg transition-colors group"
                                                >
                                                    <p className="font-bold text-sm text-slate-700 group-hover:text-purple-700">{p.name}</p>
                                                    {p.description && <p className="text-[10px] text-slate-400 line-clamp-1">{p.description}</p>}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                    
                    <textarea
                        name="plan"
                        rows={6}
                        value={planText}
                        onChange={(e) => setPlanText(e.target.value)}
                        placeholder="Medicamentos recetados, indicaciones al propietario..."
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium resize-none shadow-inner text-foreground"
                    />
                </div>
            </div>

            {/* Medical Orders (Smart Exams) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border/40 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
                    🧪 Órdenes Médicas
                </h3>
                <p className="text-sm text-muted-foreground">Selecciona los estudios a realizar. El sistema creará las órdenes pendientes.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {["Hematología", "Bioquímica Sanguínea", "Urianálisis", "Coprológico", "Rayos X", "Ecografía Abdominal", "Citología", "Test de Parvovirus", "Test de Distemper"].map((exam) => (
                        <label key={exam} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                name="exams"
                                value={exam}
                                className="w-5 h-5 text-primary rounded focus:ring-primary/50 border-gray-300"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{exam}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Inventory / Recipe Section */}
            <ConsultationInventoryManager />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
                <Link href={`/dashboard/patients/${petId}`}>
                    <button type="button" className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-all">
                        <X size={20} />
                        Cancelar
                    </button>
                </Link>
                <SubmitButtons billingEnabled={billingEnabled} />
            </div>

        </form >
    );
}
