"use client";

import { useState } from "react";
import { updateClinicSubscription, renewSubscription } from "@/actions/superadmin";
import { toast } from "sonner";
import { Building2, CheckCircle2, XCircle, ShieldAlert, DollarSign, CalendarClock } from "lucide-react";

export function ClinicsTable({ initialClinics }: { initialClinics: any[] }) {
    const [clinics, setClinics] = useState(initialClinics);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    const handleUpdate = async (id: string, plan: string, status: string) => {
        setIsUpdating(id);
        const res = await updateClinicSubscription(id, plan, status);
        if (res.success) {
            toast.success("Suscripción actualizada correctamente");
            setClinics(clinics.map(c => c.id === id ? { ...c, subscription_plan: plan, subscription_status: status } : c));
        } else {
            toast.error(res.message);
        }
        setIsUpdating(null);
    };

    const handleRenew = async (id: string) => {
        if (!confirm("¿Registrar pago de 1 mes para esta clínica?")) return;
        setIsUpdating(id);
        const res = await renewSubscription(id, 1);
        if (res.success) {
            toast.success("Pago registrado (+1 Mes)");
            setClinics(clinics.map(c => c.id === id ? { ...c, subscription_end_date: res.newDate, subscription_status: 'active' } : c));
        } else {
            toast.error(res.message);
        }
        setIsUpdating(null);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "Sin fecha";
        return new Intl.DateTimeFormat('es-VE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateString));
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950/50 font-bold uppercase text-[10px] tracking-wider text-slate-500">
                        <tr>
                            <th className="p-4">Clínica</th>
                            <th className="p-4">Contacto</th>
                            <th className="p-4">Plan Actual</th>
                            <th className="p-4">Corte de Pago</th>
                            <th className="p-4">Estado</th>
                            <th className="p-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {clinics.map((clinic) => {
                            const isExpired = clinic.subscription_end_date && new Date(clinic.subscription_end_date) < new Date();
                            
                            return (
                            <tr key={clinic.id} className="hover:bg-slate-800/20 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                            <Building2 size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{clinic.name}</p>
                                            <p className="text-xs text-slate-500">ID: {clinic.id.split('-')[0]}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <p>{clinic.email_contact || 'Sin email'}</p>
                                    <p className="text-xs text-slate-500">{clinic.phone || 'Sin teléfono'}</p>
                                </td>
                                <td className="p-4">
                                    <select 
                                        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        value={clinic.subscription_plan || 'Básico'}
                                        onChange={(e) => handleUpdate(clinic.id, e.target.value, clinic.subscription_status || 'active')}
                                        disabled={isUpdating === clinic.id}
                                    >
                                        <option value="Gratis">Gratis</option>
                                        <option value="Básico">Básico</option>
                                        <option value="Pro">Pro</option>
                                        <option value="Enterprise">Enterprise</option>
                                        <option value="On-Premise">On-Premise</option>
                                    </select>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col">
                                        <span className={`font-bold ${isExpired ? 'text-red-400' : 'text-slate-300'}`}>
                                            {formatDate(clinic.subscription_end_date)}
                                        </span>
                                        {isExpired && clinic.subscription_end_date && <span className="text-[10px] text-red-500 uppercase font-black">VENCIDO</span>}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${clinic.subscription_status === 'suspended' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                        <span className={`font-bold ${clinic.subscription_status === 'suspended' ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {clinic.subscription_status === 'suspended' ? 'Suspendida' : 'Activa'}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                            onClick={async () => {
                                                if(!confirm(`¿Entrar al dashboard de ${clinic.name} como SuperAdmin?`)) return;
                                                setIsUpdating(clinic.id);
                                                const { impersonateClinic } = await import("@/actions/superadmin");
                                                const res = await impersonateClinic(clinic.id);
                                                if(res.success) {
                                                    toast.success("Modo Dios activado. Redirigiendo...");
                                                    window.location.href = "/dashboard";
                                                } else {
                                                    toast.error(res.message);
                                                }
                                                setIsUpdating(null);
                                            }}
                                            title="Modo Dios: Entrar a la clínica"
                                            className="w-8 h-8 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors flex items-center justify-center"
                                        >
                                            <ShieldAlert size={16} />
                                        </button>
                                        
                                        <button 
                                            onClick={() => handleRenew(clinic.id)}
                                            disabled={isUpdating === clinic.id}
                                            title="Registrar 1 Mes de Pago"
                                            className="w-8 h-8 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors flex items-center justify-center"
                                        >
                                            <DollarSign size={16} />
                                        </button>
                                        
                                        {clinic.subscription_status === 'suspended' ? (
                                            <button 
                                                onClick={() => handleUpdate(clinic.id, clinic.subscription_plan || 'Básico', 'active')}
                                                disabled={isUpdating === clinic.id}
                                                className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1 w-28"
                                            >
                                                <CheckCircle2 size={14} /> Activar
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => handleUpdate(clinic.id, clinic.subscription_plan || 'Básico', 'suspended')}
                                                disabled={isUpdating === clinic.id}
                                                className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1 w-28"
                                            >
                                                <ShieldAlert size={14} /> Suspender
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )})}
                        {clinics.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">
                                    No hay clínicas registradas aún.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
