import { createAdminClient } from "@/lib/supabase/admin";
import { Phone, MessageCircle, AlertTriangle, Heart, User, MapPin } from "lucide-react";
import { notFound } from "next/navigation";

export default async function PublicPetProfile({ params }: { params: Promise<{ token: string }> }) {
    const supabaseAdmin = createAdminClient();
    const { token } = await params;

    const { data: pet, error } = await supabaseAdmin
        .from("pets")
        .select(`
            *,
            clients (
                full_name,
                phone,
                email,
                address
            ),
            clinics (
                name,
                phone,
                address
            )
        `)
        .eq("public_token", token)
        .single();

    if (error || !pet) {
        return notFound();
    }

    const whatsappUrl = `https://wa.me/${pet.clients?.phone?.replace(/\D/g, '')}`;

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center py-10 px-4 md:py-20 font-sans">
            <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100 relative">
                
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                {/* Header / Image Area */}
                <div className="relative h-72 md:h-80 bg-gradient-to-br from-slate-100 to-slate-200">
                    {pet.avatar_url ? (
                        <div className="w-full h-full p-2">
                            <img src={pet.avatar_url} alt={pet.name} className="w-full h-full object-cover rounded-[2rem] shadow-inner" />
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <User size={100} strokeWidth={1} />
                        </div>
                    )}
                    
                    {/* Floating Emergency Badge */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-red-500/90 backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-[0_8px_30px_rgb(239,68,68,0.4)] border border-white/20 animate-pulse z-10 w-max max-w-[90%] flex items-center justify-center gap-2">
                        <AlertTriangle size={16} />
                        <span className="font-bold text-xs uppercase tracking-[0.1em]">Contacto de Emergencia</span>
                    </div>

                    {/* Gradient Overlay for Text Readability if we had text over image, skip for now */}
                </div>

                {/* Patient Core Info */}
                <div className="px-8 pb-8 -mt-8 relative z-10">
                    <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-100/50 border border-slate-100/50 backdrop-blur-sm text-center transform transition-transform hover:-translate-y-1 duration-300">
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-1">{pet.name}</h1>
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider">{pet.species}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider">{pet.breed || "Mestizo"}</span>
                        </div>
                        {pet.color && (
                            <p className="text-sm text-slate-500 font-medium">{pet.color}</p>
                        )}
                        {/* Microchip Badge */}
                        {pet.microchip && (
                            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100 text-[10px] font-bold uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                CHIP: {pet.microchip}
                            </div>
                        )}
                    </div>
                </div>

                {/* Owner Info & Actions */}
                <div className="px-8 pb-10 space-y-6">
                    
                    {/* Owner Card */}
                    <div className="p-5 rounded-[1.5rem] bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/60 shadow-inner group">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="p-3.5 bg-white text-emerald-600 rounded-2xl shadow-sm border border-emerald-50 shrink-0">
                                <User size={22} strokeWidth={1.5} />
                            </div>
                            <div className="pt-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-700/60 mb-0.5">Familiar Responsable</p>
                                <p className="font-bold text-slate-800 text-lg leading-tight">{pet.clients?.full_name}</p>
                            </div>
                        </div>

                        {/* Contact Action Buttons inside Owner Card */}
                        <div className="grid grid-cols-2 gap-3">
                            <a 
                                href={whatsappUrl} 
                                target="_blank"
                                className="flex items-center justify-center py-3.5 px-4 bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-500/20 hover:bg-emerald-600 hover:-translate-y-0.5 transition-all duration-200 gap-2 font-bold text-sm"
                            >
                                <MessageCircle size={18} />
                                WhatsApp
                            </a>
                            <a 
                                href={`tel:${pet.clients?.phone}`}
                                className="flex items-center justify-center py-3.5 px-4 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 hover:-translate-y-0.5 transition-all duration-200 gap-2 font-bold text-sm"
                            >
                                <Phone size={18} />
                                Llamar
                            </a>
                        </div>
                    </div>

                    {/* Clinic Stamp */}
                    <div className="pt-4 px-2">
                        <div className="flex items-center gap-4 text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 shrink-0 text-slate-400">
                                <Heart size={20} strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Centro Veterinario Autorizado</p>
                                <p className="font-bold text-slate-700 text-sm">{pet.clinics?.name}</p>
                                <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                                    <Phone size={12} /> {pet.clinics?.phone}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Brand */}
                <div className="bg-slate-900 px-8 py-5 text-center flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <p className="text-white/60 font-medium text-[10px] tracking-[0.2em] uppercase">Protegido por Vetinet</p>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
            </div>
        </div>
    );
}
