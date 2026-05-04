"use client";

import { ClipboardList, Syringe, Pencil, FileText, Activity, Skull, QrCode, X, Trash2, Printer, User, Share2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { VaccineModal } from "./VaccineModal";
import { WeightModal } from "./WeightModal";
import { deletePatient } from "@/actions/patients";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

interface PatientListItemProps {
    patient: any;
}

export function PatientListItem({ patient }: PatientListItemProps) {
    const router = useRouter();
    const [showVaccineModal, setShowVaccineModal] = useState(false);
    const [showWeightModal, setShowWeightModal] = useState(false);

    // Helper
    const calculateAge = (birthDate: string | null) => {
        if (!birthDate) return "N/A";
        const birth = new Date(birthDate);
        const now = new Date();
        const diff = now.getFullYear() - birth.getFullYear();
        const isBeforeBirthday = now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
        const age = isBeforeBirthday ? diff - 1 : diff;

        if (age === 0) {
            const months = now.getMonth() - birth.getMonth() + (12 * (now.getFullYear() - birth.getFullYear()));
            return `${months} meses`;
        }
        return `${age} años`;
    };

    // Navigation Handlers
    const goToProfile = () => router.push(`/dashboard/patients/${patient.id}`);
    const goToHistory = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/dashboard/patients/${patient.id}`); // Currently distinct history page doesn't exist, goes to profile
    };
    const openVaccine = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowVaccineModal(true);
    };
    const goToEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/dashboard/patients/${patient.id}/edit`);
    };

    const openWeight = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (patient.is_deceased) return;
        setShowWeightModal(true);
    };

    const handleQrClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const baseUrl = window.location.origin;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${baseUrl}/pet/${patient.public_token}`;
        window.open(qrUrl, '_blank');
    };

    const handlePrint = (e: React.MouseEvent) => {
        e.stopPropagation();
        window.open(`/print/patient-history/${patient.id}`, '_blank');
    };

    const handleSharePortal = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const baseUrl = window.location.origin;
        const shareUrl = `${baseUrl}/share/${patient.share_token}`;
        
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success("Enlace del Portal del Dueño copiado al portapapeles");
        } catch (err) {
            toast.error("Error al copiar el enlace");
        }
    };

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isPending, startTransition] = useTransition();

    const confirmDelete = async () => {
        startTransition(async () => {
            const res = await deletePatient(patient.id);
            if (res.success) {
                toast.success("Paciente eliminado correctamente");
                setShowDeleteModal(false);
                router.refresh();
            } else {
                toast.error(res.message);
            }
        });
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDeleteModal(true);
    };

    return (
        <>
            <div
                onClick={goToProfile}
                className="group bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-border/10 dark:border-slate-800 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all flex flex-col md:flex-row items-center gap-8 cursor-pointer relative overflow-hidden"
            >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-white dark:border-slate-700 shadow-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative transition-transform group-hover:rotate-3">
                        {patient.avatar_url ? (
                            <img src={patient.avatar_url} alt={patient.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-3xl">{patient.species === 'Gato' ? '🐱' : '🐶'}</span>
                        )}
                        {patient.is_deceased && (
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                                <span className="text-white text-3xl">✝️</span>
                            </div>
                        )}
                    </div>
                    <span className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-2xl border-4 border-white dark:border-slate-900 flex items-center justify-center text-xs text-white shadow-lg ${patient.sex === 'male' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                        {patient.sex === 'male' ? '♂' : '♀'}
                    </span>
                </div>

                {/* Main Info */}
                <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 font-heading tracking-tight group-hover:text-primary transition-colors uppercase">{patient.name}</h3>
                        <div className="flex items-center gap-2 w-fit mx-auto md:mx-0">
                            <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                                {patient.species} • {patient.breed || "Mestizo"}
                            </span>
                        </div>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 space-y-2 font-medium">
                        <p className="flex items-center justify-center md:justify-start gap-2">
                            <span>Edad:</span> <span className="text-slate-800 dark:text-slate-200 font-bold">{calculateAge(patient.birth_date)}</span>
                            <span className="opacity-20">•</span>
                            <span>Peso:</span> <button onClick={openWeight} className="text-slate-800 dark:text-slate-200 font-bold hover:text-primary hover:underline bg-slate-50 dark:bg-slate-800 px-3 py-0.5 rounded-lg transition-all" title="Actualizar Peso">{patient.weight_kg ? `${patient.weight_kg}kg` : "N/A"}</button>
                        </p>
                        <p className="flex items-center justify-center md:justify-start gap-2">
                            <span className="p-1 bg-primary/10 rounded-lg text-primary"><User size={14} /></span>
                            <span className="font-bold text-slate-600 dark:text-slate-400">Propietario:</span>
                            <span className="text-primary font-bold hover:underline cursor-pointer">
                                {patient.clients?.full_name || "Desconocido"}
                            </span>
                        </p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity w-full md:w-auto">
                    <button
                        onClick={handleSharePortal}
                        className="z-10 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                        title="Copiar Enlace del Portal del Dueño"
                    >
                        <Share2 size={20} />
                    </button>
                    <button
                        onClick={handleQrClick}
                        className="z-10 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Generar Código QR de Emergencia"
                    >
                        <QrCode size={20} />
                    </button>
                    <button
                        onClick={handlePrint}
                        className="z-10 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                        title="Imprimir Historia Clínica"
                    >
                        <Printer size={20} />
                    </button>
                    <button
                        onClick={goToHistory}
                        className="z-10 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        title="Historial Médico"
                    >
                        <ClipboardList size={20} />
                    </button>
                    {!patient.is_deceased && (
                        <>
                            <button
                                onClick={openVaccine}
                                className="z-10 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                                title="Registrar Vacuna"
                            >
                                <Syringe size={20} />
                            </button>
                            <button
                                onClick={openWeight}
                                className="z-10 p-2.5 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
                                title="Actualizar Peso"
                            >
                                <Activity size={20} />
                            </button>
                        </>
                    )}
                    <button
                        onClick={goToEdit}
                        className="z-10 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Editar Perfil"
                    >
                        <Pencil size={20} />
                    </button>
                    <button
                        onClick={handleDeleteClick}
                        className="z-10 p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        title="Eliminar Paciente"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            {/* Render Modal if active */}
            {showVaccineModal && (
                <VaccineModal
                    onClose={() => setShowVaccineModal(false)}
                    petId={patient.id}
                />
            )}

            <WeightModal
                isOpen={showWeightModal}
                onClose={() => setShowWeightModal(false)}
                petId={patient.id}
                currentWeight={patient.weight_kg}
            />

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="¿Eliminar Paciente?"
                description={`Esta acción borrará permanentemente el expediente de "${patient.name}". Toda la historia clínica se perderá y no podrá recuperarse.`}
                confirmText="Sí, Eliminar"
                isDestructive={true}
                isLoading={isPending}
            />
        </>
    );
}
