"use client";

import { useState, Suspense, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, ArrowDownToLine } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

import { useSearchParams } from "next/navigation";

function LoginContent() {
    const searchParams = useSearchParams();
    const initialMode = searchParams.get("mode") === "register" ? false : true;
    
    const [isLogin, setIsLogin] = useState(initialMode);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [clinicName, setClinicName] = useState("");
    const [error, setError] = useState<string | null>(null);

    const [installPrompt, setInstallPrompt] = useState<any>(null);

    // Initial effect to handle URL errors and PWA install prompt
    useEffect(() => {
        if (searchParams.get("error") === "account_suspended") {
            setError("Tu cuenta ha sido suspendida por el administrador de la clínica.");
            toast.error("Cuenta suspendida", { duration: 5000 });
        }

        const handlePrompt = (e: any) => {
            e.preventDefault();
            setInstallPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handlePrompt);
        return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
    }, [searchParams]);

    const handleInstall = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
            setInstallPrompt(null);
            toast.success("¡Vetinet se está instalando!");
        }
    };

    const supabase = createClient();

    const handleAuth = async (e: React.FormEvent) => {
        // ... (rest of handleAuth remains same)
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                
                // Check if user is superadmin
                if (data?.user?.email === 'abrahanruiz1@gmail.com') {
                    window.location.href = "/superadmin";
                    return;
                }
                
                // Secondary check for other superadmins in DB
                if (data?.user) {
                    const { data: userData } = await supabase
                        .from('users')
                        .select('is_superadmin')
                        .eq('id', data.user.id)
                        .single();
                        
                    if (userData?.is_superadmin) {
                        window.location.href = "/superadmin";
                        return;
                    }
                }
                
                window.location.href = "/dashboard";
            } else {
                const formData = new FormData();
                formData.append("email", email);
                formData.append("password", password);
                formData.append("clinicName", clinicName);
                const { registerClinic } = await import("@/actions/register-clinic");
                const result = await registerClinic(null, formData);
                if (!result.success) throw new Error(result.message);
                toast.success("¡Registro exitoso! Ya puedes iniciar sesión.");
                setIsLogin(true);
            }
        } catch (err: any) {
            let msg = err.message;
            if (msg === "Invalid login credentials") msg = "Correo o contraseña incorrectos.";
            if (msg === "User already registered") msg = "Este correo ya está registrado.";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-slate-50 relative overflow-hidden">
            {/* ... (rest of the JSX from original LoginPage) */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>

            <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-8">
                <div className="relative z-10 max-w-lg text-left">
                    <Link href="/" className="inline-block mb-8 hover:opacity-80 transition-opacity">
                        <div className="h-40 w-auto">
                            <img src="/veti_logo.png" alt="Vetinet" className="h-full w-auto object-contain" />
                        </div>
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-foreground mb-4 leading-tight">
                        La central de mando <br /> <span className="text-primary">de tu clínica.</span>
                    </h1>
                    <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                        Gestiona pacientes, citas y finanzas desde un entorno diseñado para la paz mental del veterinario moderno.
                    </p>
                    <div className="bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-white/50 shadow-sm">
                        <div className="flex gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map(i => <span key={i} className="text-amber-400">★</span>)}
                        </div>
                        <p className="text-sm font-medium text-foreground italic">"Vetinet transformó el caos de mi recepción en un flujo de trabajo silencioso y eficiente."</p>
                        <p className="text-xs font-bold text-primary mt-3">— Dra. Sofia M., Clínica Fauna</p>
                    </div>
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-6 md:p-8 border border-border/40"
                >
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-foreground font-heading">{isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}</h2>
                        <p className="text-muted-foreground text-sm mt-1">{isLogin ? "Ingresa tus credenciales para acceder." : "Prueba Vetinet gratis hoy mismo."}</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        {!isLogin && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-1.5 overflow-hidden">
                                <label className="text-sm font-bold text-foreground ml-1">Nombre de tu Clínica</label>
                                <div className="relative group mb-4">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🏥</div>
                                    <input type="text" required={!isLogin} placeholder="Ej. Centro Veterinario Dr. House" value={clinicName} onChange={(e) => setClinicName(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-foreground" />
                                </div>
                            </motion.div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-foreground ml-1">Correo Electrónico</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                                <input type="email" required placeholder="doctor@clinica.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-foreground" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-foreground ml-1">Contraseña</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                                <input type={showPassword ? "text" : "password"} required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-foreground" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-foreground transition-colors">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {isLogin && (
                            <div className="flex justify-end">
                                <a href="#" className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">¿Olvidaste tu contraseña?</a>
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <>{isLogin ? "Iniciar Sesión" : "Crear Cuenta"} <ArrowRight size={20} /></>}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            {isLogin ? "¿Aún no tienes cuenta?" : "¿Ya tienes una cuenta?"}{" "}
                            <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="font-bold text-primary hover:underline transition-all">
                                {isLogin ? "Regístrate Gratis" : "Inicia Sesión"}
                            </button>
                        </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-border/40 text-center">
                        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Volver al inicio</Link>
                    </div>

                    <AnimatePresence>
                        {installPrompt && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="lg:hidden mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800 flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500 text-white rounded-xl">
                                        <ArrowDownToLine size={18} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">App Disponible</p>
                                        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Instalar Vetinet en Inicio</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleInstall}
                                    className="px-4 py-2 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20"
                                >
                                    Instalar
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-primary" size={40} /></div>}>
            <LoginContent />
        </Suspense>
    );
}
