"use client";

import { useState } from "react";
import { updateClinicSubscription, renewSubscription, toggleClinicBilling, deleteClinicPermanent } from "@/actions/superadmin";
import { toast } from "sonner";
import { Building2, CheckCircle2, XCircle, ShieldAlert, DollarSign, ReceiptText, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function ClinicsTable({ initialClinics }: { initialClinics: any[] }) {
    const [clinics, setClinics] = useState(initialClinics);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        description: React.ReactNode;
        isDestructive?: boolean;
        confirmText?: string;
        action: () => Promise<void>;
    } | null>(null);

    const closeModal = () => setModalConfig(null);

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

    const handleDelete = async (id: string, name: string) => {
        setModalConfig({
            isOpen: true,
            title: "Eliminar Clínica Permanentemente",
            description: (
                <div className="space-y-2">
                    <p>Estás a punto de borrar la clínica <strong>{name}</strong> de forma irreversible.</p>
                    <p className="text-red-400 font-bold">Esta acción destruirá todas sus facturas, pacientes, inventario y usuarios.</p>
                    <p>¿Estás completamente seguro?</p>
                </div>
            ),
            isDestructive: true,
            confirmText: "Sí, Eliminar Todo",
            action: async () => {
                setIsUpdating(id);
                const res = await deleteClinicPermanent(id);
                if (res.success) {
                    toast.success("Clínica y todos sus datos eliminados para siempre.");
                    setClinics(clinics.filter(c => c.id !== id));
                } else {
                    toast.error(res.message);
                }
                setIsUpdating(null);
                closeModal();
            }
        });
    };

    const handleToggleBilling = async (id: string, currentStatus: boolean) => {
        setIsUpdating(id);
        const res = await toggleClinicBilling(id, !currentStatus);
        if (res.success) {
            toast.success(`Facturación ${!currentStatus ? 'Activada' : 'Desactivada'}`);
            setClinics(clinics.map(c => c.id === id ? { ...c, billing_enabled: !currentStatus } : c));
        } else {
            toast.error(res.message);
        }
        setIsUpdating(null);
    };

    const handleRenew = async (id: string, name: string) => {
        setModalConfig({
            isOpen: true,
            title: "Registrar Pago",
            description: `¿Confirmas que has recibido el pago y deseas sumar 1 mes de suscripción a ${name}?`,
            confirmText: "Registrar Pago (+1 Mes)",
            action: async () => {
                setIsUpdating(id);
                const res = await renewSubscription(id, 1);
                if (res.success) {
                    toast.success("Pago registrado (+1 Mes)");
                    setClinics(clinics.map(c => c.id === id ? { ...c, subscription_end_date: res.newDate, subscription_status: 'active' } : c));
                } else {
                    toast.error(res.message);
                }
                setIsUpdating(null);
                closeModal();
            }
        });
    };

    const handleImpersonate = async (id: string, name: string) => {
        setModalConfig({
            isOpen: true,
            title: "Activar Modo Dios",
            description: `Vas a entrar al panel de control de ${name} con permisos absolutos de SuperAdmin. ¿Continuar?`,
            confirmText: "Entrar a Clínica",
            action: async () => {
                setIsUpdating(id);
                const { impersonateClinic } = await import("@/actions/superadmin");
                const res = await impersonateClinic(id);
                if(res.success) {
                    toast.success("Modo Dios activado. Redirigiendo...");
                    window.location.href = "/dashboard";
                } else {
                    toast.error(res.message);
                    setIsUpdating(null);
                    closeModal();
                }
            }
        });
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "Sin fecha";
        return new Intl.DateTimeFormat('es-VE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateString));
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300 hidden md:table">
                    <thead className="bg-slate-950/50 font-bold uppercase text-[10px] tracking-wider text-slate-500">
                        <tr>
                            <th className="p-4">Clínica</th>
                            <th className="p-4">Contacto</th>
                            <th className="p-4">Plan Actual</th>
                            <th className="p-4">Corte de Pago</th>
                            <th className="p-4 text-center">Facturación</th>
                            <th className="p-4 text-center">Estado</th>
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
                                        value={clinic.subscription_plan || 'Trial'}
                                        onChange={(e) => handleUpdate(clinic.id, e.target.value, clinic.subscription_status || 'active')}
                                        disabled={isUpdating === clinic.id}
                                    >
                                        <option value="Trial">Trial</option>
                                        <option value="Pago">Pago</option>
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
                                <td className="p-4 text-center">
                                    <button
                                        onClick={() => handleToggleBilling(clinic.id, clinic.billing_enabled !== false)}
                                        disabled={isUpdating === clinic.id}
                                        className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase transition-all flex items-center gap-1.5 mx-auto ${clinic.billing_enabled !== false ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'bg-slate-800 text-slate-500 border border-slate-700 opacity-50'}`}
                                    >
                                        {clinic.billing_enabled !== false ? <ReceiptText size={14} /> : <XCircle size={14} />}
                                        {clinic.billing_enabled !== false ? "ON" : "OFF"}
                                    </button>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${clinic.subscription_status === 'suspended' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                        <span className={`font-bold ${clinic.subscription_status === 'suspended' ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {clinic.subscription_status === 'suspended' ? 'Susp.' : 'Activa'}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                            onClick={() => handleImpersonate(clinic.id, clinic.name)}
                                            disabled={isUpdating === clinic.id}
                                            title="Modo Dios: Entrar a la clínica"
                                            className="w-8 h-8 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors flex items-center justify-center"
                                        >
                                            <ShieldAlert size={16} />
                                        </button>
                                        
                                        <button 
                                            onClick={() => handleRenew(clinic.id, clinic.name)}
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
                                        
                                        <button 
                                            onClick={() => handleDelete(clinic.id, clinic.name)}
                                            disabled={isUpdating === clinic.id}
                                            title="Eliminar Permanente"
                                            className="w-8 h-8 ml-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors flex items-center justify-center"
                                        >
                                            <Trash2 size={16} />
                                        </button>
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
                
                {/* Mobile Card View */}
                <div className="md:hidden flex flex-col divide-y divide-slate-800/50">
                    {clinics.map((clinic) => {
                        const isExpired = clinic.subscription_end_date && new Date(clinic.subscription_end_date) < new Date();
                        
                        return (
                        <div key={`mobile-${clinic.id}`} className="p-4 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                        <Building2 size={18} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-base">{clinic.name}</p>
                                        <p className="text-xs text-slate-400">{clinic.email_contact || 'Sin email'}</p>
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded text-xs font-bold ${clinic.subscription_status === 'suspended' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                    {clinic.subscription_status === 'suspended' ? 'Susp.' : 'Activa'}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-slate-950/50 rounded-lg p-3">
                                    <p className="text-xs text-slate-500 mb-1">Plan</p>
                                    <select 
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white outline-none text-xs"
                                        value={clinic.subscription_plan || 'Trial'}
                                        onChange={(e) => handleUpdate(clinic.id, e.target.value, clinic.subscription_status || 'active')}
                                        disabled={isUpdating === clinic.id}
                                    >
                                        <option value="Trial">Trial</option>
                                        <option value="Pago">Pago</option>
                                    </select>
                                </div>
                                <div className="bg-slate-950/50 rounded-lg p-3">
                                    <p className="text-xs text-slate-500 mb-1">Vencimiento</p>
                                    <p className={`font-bold text-xs ${isExpired ? 'text-red-400' : 'text-slate-300'}`}>
                                        {formatDate(clinic.subscription_end_date)}
                                    </p>
                                    {isExpired && clinic.subscription_end_date && <span className="text-[10px] text-red-500 uppercase font-black">VENCIDO</span>}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/50">
                                <button 
                                    onClick={() => handleImpersonate(clinic.id, clinic.name)}
                                    disabled={isUpdating === clinic.id}
                                    className="flex-1 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg py-2 flex items-center justify-center transition-colors"
                                >
                                    <ShieldAlert size={16} />
                                </button>
                                
                                <button 
                                    onClick={() => handleRenew(clinic.id, clinic.name)}
                                    disabled={isUpdating === clinic.id}
                                    className="flex-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg py-2 flex items-center justify-center transition-colors"
                                >
                                    <DollarSign size={16} />
                                </button>
                                
                                {clinic.subscription_status === 'suspended' ? (
                                    <button 
                                        onClick={() => handleUpdate(clinic.id, clinic.subscription_plan || 'Trial', 'active')}
                                        disabled={isUpdating === clinic.id}
                                        className="flex-[2] bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg py-2 font-bold text-xs transition-colors flex items-center justify-center gap-1"
                                    >
                                        <CheckCircle2 size={14} /> Activar
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleUpdate(clinic.id, clinic.subscription_plan || 'Trial', 'suspended')}
                                        disabled={isUpdating === clinic.id}
                                        className="flex-[2] bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg py-2 font-bold text-xs transition-colors flex items-center justify-center gap-1"
                                    >
                                        <ShieldAlert size={14} /> Suspender
                                    </button>
                                )}
                                
                                <button 
                                    onClick={() => handleDelete(clinic.id, clinic.name)}
                                    disabled={isUpdating === clinic.id}
                                    className="flex-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg py-2 flex items-center justify-center transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    )})}
                    {clinics.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            No hay clínicas registradas aún.
                        </div>
                    )}
                </div>
            </div>

            {modalConfig && (
                <ConfirmModal
                    isOpen={modalConfig.isOpen}
                    onClose={closeModal}
                    onConfirm={modalConfig.action}
                    title={modalConfig.title}
                    description={modalConfig.description}
                    confirmText={modalConfig.confirmText}
                    isDestructive={modalConfig.isDestructive}
                    isLoading={isUpdating !== null}
                />
            )}
        </div>
    );
}
