"use client";

import { useState, useEffect, useRef } from "react";
import { 
    Building2, DollarSign, Users, ShieldCheck, Check, Globe, Mail, Phone, MapPin, 
    Key, TrendingUp, AlertCircle, BadgeCheck, X, UserCircle2, Power, PowerOff,
    MessageSquare, MessageCircle, Send, Calendar, Camera
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    getClinicData, updateClinicData, getClinicMembers, updateClinicLogo, 
    addClinicMember, updateClinicMember, forceResetMemberPassword,
    updateCommunicationSettings
} from "@/actions/clinic-actions";
import { updateExchangeRateSettings, updateClinicSettings } from "@/actions/clinic-settings";
import { updateOwnPassword } from "@/actions/auth-actions";
import { updateProfile, updateAvatar } from "@/actions/profile-actions";
import { toast } from "sonner";
import { Drawer } from "vaul";
import { useMediaQuery } from "@/hooks/use-media-query";
import { createClient } from "@/lib/supabase/client";

export function SettingsView({ userRole, currentUser }: { userRole: string, currentUser: { email: string, name: string } }) {
    const isAdmin = userRole === 'admin';
    const initialTab = isAdmin ? 'clinic' : 'profile';
    const [activeTab, setActiveTab] = useState(initialTab);
    
    const [clinic, setClinic] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Password Update State
    const [pwd, setPwd] = useState("");
    const [pwdConfirm, setPwdConfirm] = useState("");
    const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);

    // Team Modal State
    const [showAddMember, setShowAddMember] = useState(false);
    const [showEditMember, setShowEditMember] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [isSubmittingMember, setIsSubmittingMember] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const loadData = async () => {
        setIsLoading(true);
        const supabase = createClient();
        
        // 1. Fetch clinic data if admin
        if (isAdmin) {
            const [appData, appMembers] = await Promise.all([
                getClinicData(),
                getClinicMembers()
            ]);
            setClinic(appData);
            setMembers(appMembers);
        }

        // 2. Fetch current user profile (for both admin and staff)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from("users")
                .select("*")
                .eq("id", user.id)
                .single();
            setUserProfile(profile);
        }

        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [isAdmin]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("avatar", file);

        setIsUploadingAvatar(true);
        const res = await updateAvatar(formData);
        setIsUploadingAvatar(false);

        if (res.success) {
            toast.success("Foto de perfil actualizada");
            loadData();
        } else {
            toast.error(res.message || "Error al subir foto");
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        setIsLoading(true);
        const res = await updateProfile(formData);
        setIsLoading(false);

        if (res.success) {
            toast.success("Perfil actualizado");
            loadData();
        } else {
            toast.error(res.message || "Error al actualizar perfil");
        }
    };

    // Profile & Security Actions
    const handleUpdateOwnPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pwd !== pwdConfirm) return toast.error("Las contraseñas no coinciden");
        if (pwd.length < 6) return toast.error("Mínimo 6 caracteres");
        
        setIsUpdatingPwd(true);
        const res = await updateOwnPassword(pwd);
        setIsUpdatingPwd(false);

        if (res.success) {
            toast.success("Contraseña actualizada correctamente");
            setPwd("");
            setPwdConfirm("");
        } else {
            toast.error(res.message || "Error al actualizar contraseña");
        }
    };

    // Admin Clinic Actions
    const handleClinicUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const res = await updateClinicData(formData);
        if (res.success) {
            toast.success("Datos de la clínica actualizados");
            loadData();
        } else toast.error(res.message);
    };

    const handleRateUpdate = async (mode: any, rate: number, currency?: string) => {
        const res = await updateExchangeRateSettings({ 
            mode, 
            manualRate: rate,
            preferredCurrency: currency || clinic?.settings?.preferred_currency || 'USD'
        });
        if (res.success) {
            toast.success("Configuración de tasa actualizada");
            loadData();
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append("logo", file);
        const res = await updateClinicLogo(formData);
        setIsUploading(false);
        if (res.success) {
            toast.success("Logo actualizado correctamente");
            loadData();
        } else toast.error(res.message || "Error al subir el logo");
    };

    // Admin Team Actions
    const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            password: formData.get("password") as string,
            role: formData.get("role") as string,
        };
        
        if (data.password.length < 6) return toast.error("Contraseña muy corta");
        
        setIsSubmittingMember(true);
        const res = await addClinicMember(data);
        setIsSubmittingMember(false);

        if (res.success) {
            toast.success("Miembro agregado correctamente");
            setShowAddMember(false);
            loadData();
        } else {
            toast.error(res.message || "Error al agregar miembro");
        }
    };

    const handleUpdateMember = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const payload = {
            role: formData.get("role") as string,
            status: formData.get("status") as string,
        };
        
        setIsSubmittingMember(true);
        const res = await updateClinicMember(selectedMember.id, payload);
        setIsSubmittingMember(false);

        if (res.success) {
            toast.success("Miembro actualizado correctamente");
            setShowEditMember(false);
            loadData();
        } else {
            toast.error(res.message || "Error al actualizar miembro");
        }
    };

    const handleForceResetPassword = async () => {
        const newPwd = prompt("Ingresa la nueva contraseña para este usuario (mínimo 6 caracteres):");
        if (!newPwd) return;
        if (newPwd.length < 6) return toast.error("Contraseña muy corta");
        
        const res = await forceResetMemberPassword(selectedMember.id, newPwd);
        if (res.success) {
            toast.success("Contraseña del usuario reseteada");
        } else {
            toast.error(res.message || "Error al resetear contraseña");
        }
    };

    const handleCommunicationUpdate = async (newSettings: any) => {
        const res = await updateCommunicationSettings(newSettings);
        if (res.success) {
            toast.success("Configuración de comunicación actualizada");
            loadData();
        } else {
            toast.error(res.message);
        }
    };

    const handleSettingsUpdate = async (newSettings: any) => {
        const res = await updateClinicSettings(newSettings);
        if (res.success) {
            toast.success("Configuración actualizada");
            loadData();
        } else {
            toast.error(res.message);
        }
    };

    // Filter Tabs
    const allTabs = [
        { id: 'profile', label: 'Mi Perfil', icon: <UserCircle2 size={18} /> },
        { id: 'security', label: 'Seguridad', icon: <ShieldCheck size={18} /> },
        { id: 'clinic', label: 'Clínica', icon: <Building2 size={18} />, adminOnly: true },
        { id: 'finance', label: 'Finanzas', icon: <DollarSign size={18} />, adminOnly: true },
        { id: 'team', label: 'Equipo', icon: <Users size={18} />, adminOnly: true },
        { id: 'appointments', label: 'Citas', icon: <Calendar size={18} />, adminOnly: true },
        { id: 'communication', label: 'Comunicación', icon: <MessageSquare size={18} />, adminOnly: true },
    ];

    const visibleTabs = allTabs.filter(t => !t.adminOnly || isAdmin);

    if (isLoading) return (
        <div className="flex items-center justify-center p-20 text-slate-400">
            <div className="animate-spin border-4 border-primary border-t-transparent rounded-full h-8 w-8 mr-3"></div>
            Cargando configuración...
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 relative">
            
            {/* Header / Tabs Nav */}
            <div className="bg-white dark:bg-slate-900 p-2 rounded-[2rem] border border-border/40 dark:border-slate-800 shadow-sm flex gap-2 overflow-x-auto custom-scrollbar">
                {visibleTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                            activeTab === tab.id 
                            ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xl shadow-slate-900/20 dark:shadow-slate-100/10' 
                            : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200'
                        }`}
                    >
                        {tab.icon}
                        <span className="hidden md:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'profile' && (
                        <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] border border-border/40 dark:border-slate-800 shadow-sm space-y-10">
                            <div className="text-center space-y-6">
                                <div className="relative inline-block group">
                                    <div 
                                        onClick={() => avatarInputRef.current?.click()}
                                        className="w-32 h-32 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-[2.5rem] mx-auto flex items-center justify-center font-black text-3xl overflow-hidden border-4 border-white dark:border-slate-900 shadow-xl cursor-pointer hover:opacity-90 transition-all"
                                    >
                                        {userProfile?.avatar_url ? (
                                            <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            currentUser.name.charAt(0) || 'U'
                                        )}
                                        {isUploadingAvatar && (
                                            <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 flex items-center justify-center">
                                                <div className="animate-spin border-2 border-primary border-t-transparent rounded-full h-5 w-5"></div>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Camera size={24} className="text-white" />
                                        </div>
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={avatarInputRef} 
                                        onChange={handleAvatarUpload} 
                                        className="hidden" 
                                        accept="image/*" 
                                    />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{userProfile?.full_name || currentUser.name || 'Usuario'}</h3>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full inline-block mt-1">{userRole}</p>
                                </div>
                            </div>

                            <form onSubmit={handleProfileUpdate} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre Completo</label>
                                    <input 
                                        name="fullName" 
                                        defaultValue={userProfile?.full_name || currentUser.name} 
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-inner" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Correo Electrónico (No editable)</label>
                                    <input type="email" disabled value={currentUser.email} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-bold text-slate-400 cursor-not-allowed opacity-60" />
                                </div>
                                
                                <button type="submit" disabled={isLoading} className="w-full py-5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-slate-900/20 dark:shadow-slate-100/10 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 mt-4">
                                    {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] border border-border/40 dark:border-slate-800 shadow-sm space-y-10">
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-[2.5rem] mx-auto flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-lg">
                                    <Key size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">Actualizar Contraseña</h3>
                                <p className="text-slate-400 text-sm italic pr-4 pl-4">"Protege tu cuenta de Vetinet. Esta contraseña es privada y solo tú podrás cambiarla desde aquí."</p>
                            </div>

                            <form onSubmit={handleUpdateOwnPassword} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nueva Contraseña</label>
                                    <input 
                                        type="password" 
                                        value={pwd} 
                                        onChange={e => setPwd(e.target.value)}
                                        placeholder="••••••••" 
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-slate-800 dark:text-slate-100 shadow-inner" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirmar Nueva Contraseña</label>
                                    <input 
                                        type="password" 
                                        value={pwdConfirm} 
                                        onChange={e => setPwdConfirm(e.target.value)}
                                        placeholder="••••••••" 
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-slate-800 dark:text-slate-100 shadow-inner" 
                                    />
                                </div>
                                <button disabled={isUpdatingPwd} type="submit" className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all mt-4 disabled:opacity-50">
                                    {isUpdatingPwd ? 'Actualizando...' : 'Actualizar Mis Credenciales'}
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'clinic' && isAdmin && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Clinic Form Code - Kept Identical */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-border/40 dark:border-slate-800 text-center space-y-4">
                                    {/* Hiding logo upload as per business rule: personalization is a premium tier */}
                                    <div className="hidden">
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-32 h-32 bg-slate-50 dark:bg-slate-800 rounded-[3rem] mx-auto border-4 border-white dark:border-slate-900 shadow-xl overflow-hidden flex items-center justify-center text-slate-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all group relative"
                                        >
                                            {clinic?.logo_url ? (
                                                <img src={clinic.logo_url} alt="Logo" className="w-full h-full object-cover group-hover:opacity-50 transition-all" />
                                            ) : (
                                                <Building2 size={48} />
                                            )}
                                            {isUploading && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-900/60">
                                                    <div className="animate-spin border-2 border-primary border-t-transparent rounded-full h-6 w-6"></div>
                                                </div>
                                            )}
                                        </div>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            onChange={handleLogoUpload} 
                                            className="hidden" 
                                            accept="image/*"
                                        />
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading}
                                            className="text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/5 px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                                        >
                                            {isUploading ? 'Subiendo...' : (clinic?.logo_url ? 'Cambiar Logo' : 'Subir Logo')}
                                        </button>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Máximo 2MB. Format: PNG, JPG.</p>
                                    </div>

                                    {/* Simplified Static Logo Display */}
                                    <div className="w-32 h-32 bg-slate-50 dark:bg-slate-800 rounded-[3rem] mx-auto border-4 border-white dark:border-slate-900 shadow-xl overflow-hidden flex items-center justify-center text-slate-200">
                                        {clinic?.logo_url ? (
                                            <img 
                                                src={clinic.logo_url} 
                                                alt="Clinic Logo" 
                                                className="w-full h-full object-contain p-2" 
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <img src="/icono.png" alt="Vetinet Icon" className="w-20 h-20 object-contain" />
                                                <span className="text-[10px] font-black text-emerald-600 -mt-1 tracking-widest">VETINET</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Logo de la Clínica</p>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-900/30 p-6 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-900/50 italic text-emerald-700 dark:text-emerald-400 text-sm leading-relaxed">
                                    "La información legal configurada aquí aparecerá en todas tus facturas fiscales y documentos oficiales de la clínica."
                                </div>
                            </div>

                            <form onSubmit={handleClinicUpdate} className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-border/40 dark:border-slate-800 shadow-sm space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre Comercial</label>
                                        <div className="relative">
                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input name="name" defaultValue={clinic?.name} className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-slate-800 dark:text-slate-100" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Razón Social</label>
                                        <input name="legal_name" defaultValue={clinic?.legal_name} placeholder="Compañía Anonima..." className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-slate-800 dark:text-slate-100" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">RIF / C.I.</label>
                                        <input name="tax_id" defaultValue={clinic?.tax_id} placeholder="J-00000000" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-slate-800 dark:text-slate-100" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Teléfono</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input name="phone" defaultValue={clinic?.phone} className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-slate-800 dark:text-slate-100" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Correo Contacto</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input name="email_contact" defaultValue={clinic?.email_contact} className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-slate-800 dark:text-slate-100" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sitio Web</label>
                                        <div className="relative">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input name="website_url" defaultValue={clinic?.website_url} placeholder="www.tuclinica.com" className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-slate-800 dark:text-slate-100" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Dirección de la Clínica</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-4 text-slate-300" size={18} />
                                        <textarea name="address" defaultValue={clinic?.address} rows={3} className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-slate-800 dark:text-slate-100" />
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-5 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all">
                                    Guardar Información Clínica
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'finance' && isAdmin && (
                        <div className="space-y-8">
                            {/* Finance Form Code - Kept Identical */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-border/40 dark:border-slate-800 shadow-sm space-y-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
                                            <TrendingUp size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Modo de Tasa</h3>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Sincronización de divisas</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Divisa de Referencia</label>
                                            <div className="flex gap-2">
                                                {['USD', 'EUR'].map(curr => (
                                                    <button
                                                        key={curr}
                                                        onClick={() => handleRateUpdate(clinic?.settings?.exchange_rate_mode, clinic?.settings?.manual_rate, curr)}
                                                        className={`flex-1 py-3 rounded-2xl font-black text-xs border-2 transition-all ${
                                                            (clinic?.settings?.preferred_currency || 'USD') === curr 
                                                            ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-lg shadow-slate-900/20 dark:shadow-slate-100/10' 
                                                            : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
                                                        }`}
                                                    >
                                                        {curr} ({curr === 'USD' ? '$' : '€'})
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-4 space-y-4 border-t border-slate-50">
                                            <button 
                                                onClick={() => handleRateUpdate('auto_bcv', 0)}
                                                className={`w-full p-6 rounded-3xl border-2 transition-all text-left flex items-center justify-between group ${
                                                    clinic?.settings?.exchange_rate_mode !== 'manual' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
                                                }`}
                                            >
                                                <div>
                                                    <p className="font-black text-sm text-slate-800 dark:text-slate-100 uppercase tracking-widest">Automático (BCV)</p>
                                                    <p className="text-xs text-slate-400 mt-1">Sincronizado cada hora con el Banco Central</p>
                                                </div>
                                                {clinic?.settings?.exchange_rate_mode !== 'manual' && <BadgeCheck className="text-primary" />}
                                            </button>

                                            <div className={`w-full p-6 rounded-3xl border-2 transition-all space-y-4 ${
                                                clinic?.settings?.exchange_rate_mode === 'manual' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-slate-100 dark:border-slate-700'
                                            }`}>
                                                <button 
                                                    onClick={() => handleRateUpdate('manual', clinic?.settings?.manual_rate || 54.50)}
                                                    className="w-full text-left flex items-center justify-between group"
                                                >
                                                    <div>
                                                        <p className="font-black text-sm text-slate-800 dark:text-slate-100 uppercase tracking-widest">Manual Personalizado</p>
                                                        <p className="text-xs text-slate-400 mt-1">Tú estableces el valor fijo para la clínica</p>
                                                    </div>
                                                    {clinic?.settings?.exchange_rate_mode === 'manual' && <BadgeCheck className="text-primary" />}
                                                </button>

                                                {clinic?.settings?.exchange_rate_mode === 'manual' && (
                                                    <div className="flex items-center gap-3 pt-2">
                                                        <input 
                                                            type="number" 
                                                            defaultValue={clinic?.settings?.manual_rate}
                                                            onBlur={(e) => handleRateUpdate('manual', parseFloat(e.target.value))}
                                                            className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-primary/20 dark:border-primary/40 rounded-xl text-lg font-black text-primary shadow-inner outline-none"
                                                        />
                                                        <span className="text-xs font-bold text-slate-400 uppercase">Bs / {clinic?.settings?.preferred_currency || 'USD'}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900 p-10 rounded-[3rem] text-white space-y-6 flex flex-col justify-center">
                                    <div className="p-4 bg-white/10 rounded-2xl w-fit">
                                        <AlertCircle className="text-amber-400" />
                                    </div>
                                    <h3 className="text-2xl font-black">Recordatorio Legal</h3>
                                    <p className="text-slate-400 leading-relaxed italic">
                                        "Al utilizar tasas manuales asegurate de estar bajo los lineamientos permitidos. El sistema te avisará igualmente si hay cambios bruscos en el BCV para mantenerte informado."
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'team' && isAdmin && (
                        <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-border/40 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-border/10 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Gestionar Equipo</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Colaboradores de la clínica</p>
                                </div>
                                <button 
                                    onClick={() => setShowAddMember(true)}
                                    className="w-full md:w-auto px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 dark:hover:bg-white transition-all shadow-lg shadow-slate-900/20"
                                >
                                    Añadir Miembro
                                </button>
                            </div>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/20 dark:bg-slate-800/30 border-b border-border/10 dark:border-slate-800">
                                            <th className="px-8 py-6">Usuario</th>
                                            <th className="px-8 py-6">Estatus</th>
                                            <th className="px-8 py-6">Rol Actual</th>
                                            <th className="px-8 py-6">Desde</th>
                                            <th className="px-8 py-6 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                        {members.map(m => (
                                            <tr key={m.id} className={`hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-all ${m.status === 'inactive' ? 'opacity-50' : ''}`}>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${m.status === 'inactive' ? 'bg-red-50 dark:bg-red-900/30 text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                                                            {m.user?.full_name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className={`font-bold ${m.status === 'inactive' ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'}`}>{m.user?.full_name}</p>
                                                            <p className="text-xs text-slate-400 font-bold">{m.user?.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-1.5">
                                                        {m.status === 'inactive' ? <PowerOff size={14} className="text-red-500" /> : <Power size={14} className="text-emerald-500" />}
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                            {m.status === 'inactive' ? 'Inactivo' : 'Activo'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                                        m.role === 'admin' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                                    }`}>
                                                        {m.role}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-slate-400 text-xs font-bold">
                                                    {new Date(m.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedMember(m);
                                                            setShowEditMember(true);
                                                        }}
                                                        className="text-xs font-black uppercase text-primary hover:underline"
                                                    >
                                                        Editar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards View */}
                            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                                {members.map(m => (
                                    <div key={m.id} className="p-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${m.status === 'inactive' ? 'bg-red-50 dark:bg-red-900/30 text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                                                    {m.user?.full_name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <p className={`font-bold ${m.status === 'inactive' ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'}`}>{m.user?.full_name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{m.user?.email}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setSelectedMember(m);
                                                    setShowEditMember(true);
                                                }}
                                                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest"
                                            >
                                                Editar
                                            </button>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className={`flex-1 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-center ${
                                                m.role === 'admin' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                            }`}>
                                                {m.role}
                                            </span>
                                            <div className="flex-1 flex items-center justify-center gap-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl py-2">
                                                {m.status === 'inactive' ? <PowerOff size={12} className="text-red-500" /> : <Power size={12} className="text-emerald-500" />}
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                    {m.status === 'inactive' ? 'Inactivo' : 'Activo'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}



                    {activeTab === 'communication' && isAdmin && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* WhatsApp Config */}
                                <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-border/40 dark:border-slate-800 shadow-sm space-y-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl">
                                            <MessageCircle size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">WhatsApp Business</h3>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Notificaciones Automáticas</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-slate-200">Activar WhatsApp</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Requiere Meta API Cloud</p>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                const settings = clinic.communication_settings || {};
                                                handleCommunicationUpdate({ ...settings, wa_enabled: !settings.wa_enabled });
                                            }}
                                            className={`w-12 h-6 rounded-full p-1 transition-colors ${clinic?.communication_settings?.wa_enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${clinic?.communication_settings?.wa_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    <div className={`space-y-4 transition-opacity ${clinic?.communication_settings?.wa_enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone ID de Meta</label>
                                            <input 
                                                defaultValue={clinic?.communication_settings?.wa_phone_id}
                                                onBlur={(e) => handleCommunicationUpdate({ ...clinic.communication_settings, wa_phone_id: e.target.value })}
                                                placeholder="1234567890..."
                                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 outline-none" 
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Access Token (Permanente)</label>
                                            <input 
                                                type="password"
                                                defaultValue={clinic?.communication_settings?.wa_access_token}
                                                onBlur={(e) => handleCommunicationUpdate({ ...clinic.communication_settings, wa_access_token: e.target.value })}
                                                placeholder="EAAB..."
                                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 outline-none" 
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Número de Teléfono</label>
                                            <input 
                                                defaultValue={clinic?.communication_settings?.wa_phone_number}
                                                onBlur={(e) => handleCommunicationUpdate({ ...clinic.communication_settings, wa_phone_number: e.target.value })}
                                                placeholder="+58412..."
                                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 outline-none" 
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Email Config */}
                                <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-border/40 dark:border-slate-800 shadow-sm space-y-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
                                            <Mail size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Correo Electrónico</h3>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Informes y Recordatorios</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-slate-200">Activar Email</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Gratuito / Incluido</p>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                const settings = clinic.communication_settings || {};
                                                handleCommunicationUpdate({ ...settings, email_enabled: !settings.email_enabled });
                                            }}
                                            className={`w-12 h-6 rounded-full p-1 transition-colors ${clinic?.communication_settings?.email_enabled ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${clinic?.communication_settings?.email_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-500 text-white rounded-lg">
                                                <Send size={16} />
                                            </div>
                                            <p className="text-sm font-bold text-blue-700 dark:text-blue-300">Vetinet SMTP (Default)</p>
                                        </div>
                                        <p className="text-xs text-blue-600/70 dark:text-blue-400/70 leading-relaxed">
                                            Por defecto, usaremos los servidores de Vetinet para enviar tus facturas e informes. Esto no tiene costo adicional.
                                        </p>
                                        <button className="text-[10px] font-black uppercase text-blue-500 hover:underline">
                                            Configurar SMTP Propio (Próximamente)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'appointments' && isAdmin && (
                        <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] border border-border/40 dark:border-slate-800 shadow-sm space-y-10">
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2.5rem] mx-auto flex items-center justify-center border-4 border-white shadow-lg">
                                    <Calendar size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">Central de Citas</h3>
                                <p className="text-slate-400 text-sm italic pr-4 pl-4">"Configura los números de contacto que usarán tus clientes desde el Portal del Dueño para agendar citas."</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Teléfono para Llamadas (Recepción)</label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Phone size={20} />
                                        </div>
                                        <input 
                                            defaultValue={clinic?.communication_settings?.appointments_call || clinic?.phone}
                                            onBlur={(e) => handleCommunicationUpdate({ ...clinic.communication_settings, appointments_call: e.target.value })}
                                            placeholder="+58412..."
                                            className="w-full pl-14 pr-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 px-2 font-medium">Este número se usará cuando el cliente presione el botón "Llamar".</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">WhatsApp de Citas (Secretaria)</label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500">
                                            <MessageCircle size={20} />
                                        </div>
                                        <input 
                                            defaultValue={clinic?.communication_settings?.appointments_whatsapp || clinic?.phone}
                                            onBlur={(e) => handleCommunicationUpdate({ ...clinic.communication_settings, appointments_whatsapp: e.target.value })}
                                            placeholder="+58412..."
                                            className="w-full pl-14 pr-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" 
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 px-2 font-medium">Este número recibirá los mensajes pre-escritos de solicitud de cita por WhatsApp.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Modal Añadir Miembro */}
            <Drawer.Root 
                open={showAddMember} 
                onOpenChange={(open) => !open && setShowAddMember(false)}
                direction="bottom"
            >
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
                    <Drawer.Content 
                        className={`bg-white dark:bg-slate-900 flex flex-col fixed z-[60] focus:outline-none ${
                            isDesktop 
                            ? 'top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-md rounded-[2.5rem] h-auto shadow-2xl border border-border/50 dark:border-slate-800' 
                            : 'bottom-0 left-0 right-0 rounded-t-[2.5rem] h-auto max-h-[92%]'
                        }`}
                    >
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {!isDesktop && <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 mt-4 mb-2" />}
                            
                            <div className="p-8 border-b border-border/40 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                <div>
                                    <Drawer.Title className="font-black text-slate-800 dark:text-slate-100 text-xl tracking-tight">
                                        Añadir Miembro
                                    </Drawer.Title>
                                    <Drawer.Description className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                        Nuevo colaborador para tu clínica
                                    </Drawer.Description>
                                </div>
                                <button onClick={() => setShowAddMember(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleAddMember} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre Completo</label>
                                    <input name="name" required placeholder="Ej. Juan Pérez" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none font-bold text-slate-800 dark:text-slate-100 transition-all shadow-inner" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Correo Electrónico</label>
                                    <input name="email" type="email" required placeholder="juan@clinica.com" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none font-bold text-slate-800 dark:text-slate-100 transition-all shadow-inner" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contraseña Inicial</label>
                                    <input name="password" type="password" required placeholder="Min. 6 caracteres" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none font-bold text-slate-800 dark:text-slate-100 transition-all shadow-inner" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Rol</label>
                                    <select name="role" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none font-bold text-slate-800 dark:text-slate-100 cursor-pointer transition-all shadow-inner">
                                        <option value="receptionist">Recepcionista</option>
                                        <option value="vet">Veterinario</option>
                                        <option value="cashier">Cajero</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                                <button disabled={isSubmittingMember} type="submit" className="w-full py-5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-slate-900/20 dark:shadow-slate-100/10 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50">
                                    {isSubmittingMember ? 'Creando...' : 'Crear Empleado'}
                                </button>
                            </form>
                        </div>
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>

            {/* Modal Editar Miembro */}
            <Drawer.Root 
                open={showEditMember} 
                onOpenChange={(open) => !open && setShowEditMember(false)}
                direction="bottom"
            >
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
                    <Drawer.Content 
                        className={`bg-white dark:bg-slate-900 flex flex-col fixed z-[60] focus:outline-none ${
                            isDesktop 
                            ? 'top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-md rounded-[2.5rem] h-auto shadow-2xl border border-border/50 dark:border-slate-800' 
                            : 'bottom-0 left-0 right-0 rounded-t-[2.5rem] h-auto max-h-[92%]'
                        }`}
                    >
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {!isDesktop && <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 mt-4 mb-2" />}
                            
                            <div className="p-8 border-b border-border/40 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                <div>
                                    <Drawer.Title className="font-black text-slate-800 dark:text-slate-100 text-xl tracking-tight">
                                        Editar Miembro
                                    </Drawer.Title>
                                    <Drawer.Description className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                        {selectedMember?.user?.email}
                                    </Drawer.Description>
                                </div>
                                <button onClick={() => setShowEditMember(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateMember} className="p-8 space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cambiar Rol</label>
                                    <select name="role" defaultValue={selectedMember?.role} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none font-bold text-slate-800 dark:text-slate-100 cursor-pointer transition-all shadow-inner">
                                        <option value="receptionist">Recepcionista</option>
                                        <option value="vet">Veterinario</option>
                                        <option value="cashier">Cajero</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Estatus del Usuario</label>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl flex border border-slate-100 dark:border-slate-800/50">
                                        <label className="flex-1 text-center">
                                            <input type="radio" name="status" value="active" defaultChecked={selectedMember?.status !== 'inactive'} className="hidden peer" />
                                            <div className="py-3 text-[10px] font-black uppercase tracking-widest rounded-xl cursor-pointer peer-checked:bg-white dark:peer-checked:bg-slate-700 peer-checked:text-emerald-600 dark:peer-checked:text-emerald-400 peer-checked:shadow-sm text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-all">Activo</div>
                                        </label>
                                        <label className="flex-1 text-center">
                                            <input type="radio" name="status" value="inactive" defaultChecked={selectedMember?.status === 'inactive'} className="hidden peer" />
                                            <div className="py-3 text-[10px] font-black uppercase tracking-widest rounded-xl cursor-pointer peer-checked:bg-white dark:peer-checked:bg-slate-700 peer-checked:text-red-600 dark:peer-checked:text-red-400 peer-checked:shadow-sm text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-all">Inactivo</div>
                                        </label>
                                    </div>
                                    <p className="text-[10px] text-slate-400 italic mt-1 px-1">Si lo pones inactivo, el usuario no podrá facturar.</p>
                                </div>
                                
                                <div className="pt-4">
                                    <button 
                                        type="button" 
                                        onClick={handleForceResetPassword}
                                        className="w-full py-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/40 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all border border-amber-200 dark:border-amber-900/50 shadow-sm shadow-amber-900/5"
                                    >
                                        Forzar Reseteo de Contraseña
                                    </button>
                                </div>

                                <button disabled={isSubmittingMember} type="submit" className="w-full py-5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-slate-900/20 dark:shadow-slate-100/10 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50">
                                    {isSubmittingMember ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </form>
                        </div>
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>

        </div>
    );
}
