"use client";

import { motion } from "framer-motion";
import { ArrowRight, Activity, Globe, ShieldCheck, Database, Bell, Heart, WifiOff, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-white">
      {/* Background - Soft Flat (Clean & Hygienic) */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white">
        {/* Optional: Very subtle decorative circles (Flat style) */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white rounded-full opacity-40 blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
      </div>

      {/* Navigation */}
      <PublicNavbar />

      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-6 pt-16 pb-32 flex flex-col items-center text-center">

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/20 text-secondary-foreground mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
          </span>
          <span className="text-sm font-bold tracking-wide">La tecnología que tu práctica merece</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-heading font-extrabold text-foreground leading-[1.1] tracking-tight max-w-4xl mb-6"
        >
          Gestión Clínica <span className="text-primary">DE ÉLITE</span>, <br /> Conexión Real.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-black max-w-2xl mb-10 leading-relaxed font-medium"
        >
          Deja de luchar con sistemas obsoletos. <span className="font-bold text-foreground">Centraliza</span> tus pacientes, <span className="font-bold text-foreground">automatiza</span> tu agenda y <span className="font-bold text-foreground">fideliza</span> a tus clientes en una plataforma diseñada para clínicas que lideran el mercado.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full justify-center"
        >
          {/* Primary Action Button (Flat & Rounded) */}
          <Link href="/login?mode=register">
            <button className="px-8 py-4 bg-primary text-white text-lg font-bold rounded-full shadow-lg shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 transition-all">
              <span className="flex items-center gap-2">
                Elevar mi Clínica Ahora <ArrowRight className="w-5 h-5" />
              </span>
            </button>
          </Link>

          {/* Secondary Button */}
          <a 
            href="https://wa.me/584241554495?text=Hola,%20saludos%20vengo%20de%20la%20pagina%20de%20vetinet,%20quisiera%20mas%20informacion" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-8 py-4 bg-white text-foreground border border-border text-lg font-bold rounded-full hover:bg-gray-50 transition-all shadow-sm inline-flex items-center justify-center"
          >
            Ver Demo en Vivo
          </a>
        </motion.div>

        {/* Feature Cards Showcase (Flat Style) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full max-w-6xl"
        >
          {/* Card 1 */}
          <div className="bg-card p-8 rounded-3xl flex flex-col items-start gap-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-transparent hover:border-primary/20 transition-all duration-300">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <Activity size={28} />
            </div>
            <h3 className="text-xl font-bold text-foreground font-heading">Clínica Avanzada</h3>
            <p className="text-muted-foreground">Historias médicas SOAP, odontogramas 3D y hospitalización.</p>
          </div>

          {/* Card 2 - Mint Accent */}
          <div className="bg-card p-8 rounded-3xl flex flex-col items-start gap-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-transparent hover:border-secondary/30 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/10 rounded-bl-full -mr-2 -mt-2"></div>
            <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center text-emerald-700">
              <Globe size={28} />
            </div>
            <h3 className="text-xl font-bold text-foreground font-heading">Red Social PetLife</h3>
            <p className="text-muted-foreground">Comunidad para dueños y fidelización de pacientes.</p>
          </div>

          {/* Card 3 */}
          <div className="bg-card p-8 rounded-3xl flex flex-col items-start gap-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-transparent hover:border-primary/20 transition-all duration-300">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-xl font-bold text-foreground font-heading">Seguridad QR</h3>
            <p className="text-muted-foreground">Identificación inteligente con alerta GPS.</p>
          </div>

        </motion.div>

      </div>

      {/* SECTION: Benefits (Pain & Gain) */}
      <section className="w-full bg-secondary/5 py-24 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">

          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-6">
              ¿Por qué seguir gestionando tu clínica <br /> <span className="text-primary">como en el pasado?</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Vetinet no es solo un software, es tu nuevo estándar de operación. Diseñado para eliminar el caos manual y devolverte el control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-border/50 hover:border-primary/20 transition-all flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Database size={32} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 font-heading">Base de Datos Centralizada</h3>
              <p className="text-muted-foreground leading-relaxed">
                Adiós a las fichas de papel y excels perdidos. Accede al historial completo de cada paciente (vacunas, cirugías, recetas) en milisegundos.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-border/50 hover:border-primary/20 transition-all flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Bell size={32} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 font-heading">Agenda & Recordatorios</h3>
              <p className="text-muted-foreground leading-relaxed">
                Automatiza el 90% de tu recepción. Recordatorios de vacunas por WhatsApp y citas online que reducen el ausentismo radicalmente.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-border/50 hover:border-primary/20 transition-all flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Heart size={32} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 font-heading">Fidelización Real</h3>
              <p className="text-muted-foreground leading-relaxed">
                La app PetLife conecta a los dueños con tu clínica. Gana su lealtad ofreciéndoles su "Pasaporte Digital" siempre a mano.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION: Why Vetinet (Technical Superiority) */}
      <section className="w-full bg-white py-24">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-16">

            {/* Left Content (Persuasive Copy) */}
            <div className="flex-1 text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary mb-6">
                <span className="font-bold text-sm tracking-wide">INGENIERÍA CLÍNICA SUPERIOR</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-heading font-extrabold text-foreground mb-6 leading-tight">
                No es magia, es <br /> <span className="text-primary">Potencia Absoluta.</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                La mayoría de los sistemas te abandonan cuando falla internet o se vuelven lentos con el tiempo. <br /><br />
                <strong>Vetinet es diferente.</strong> Construido con tecnología de "Grado Militar" para que tu clínica nunca se detenga, pase lo que pase.
              </p>

              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    <WifiOff className="text-gray-600" size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-foreground">Modo "Siempre Activo" (Offline-First)</h4>
                    <p className="text-muted-foreground">¿Se fue el internet? Cero estrés. Sigue atendiendo y facturando. El sistema se sincroniza solo cuando vuelve la conexión.</p>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Zap className="text-amber-600" size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-foreground">Velocidad Instantánea</h4>
                    <p className="text-muted-foreground">Optimizado para cargar en milisegundos. No hagas esperar a tus pacientes mientras "carga el sistema".</p>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <ShieldCheck className="text-emerald-600" size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-foreground">Seguridad Bancaria</h4>
                    <p className="text-muted-foreground">Tus datos son tu activo más valioso. Encriptación de punta a punta y respaldos automáticos diarios.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Right Visual (Abstract Representation of Stability) */}
            <div className="flex-1 w-full max-w-lg bg-gray-50 rounded-[3rem] p-8 md:p-12 relative overflow-hidden border border-border/50">
              {/* Decorative Abstract UI */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="relative z-10 flex flex-col gap-6">
                {/* Fake UI Card 1 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-border/40 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <div className="flex-1">
                    <div className="h-2 w-24 bg-gray-200 rounded-full mb-2"></div>
                    <div className="h-2 w-16 bg-gray-100 rounded-full"></div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Sincronizado</span>
                </div>

                {/* Fake UI Card 2 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-border/40 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">AI</div>
                  <div className="flex-1">
                    <div className="h-2 w-32 bg-gray-200 rounded-full mb-2"></div>
                    <div className="h-2 w-20 bg-gray-100 rounded-full"></div>
                  </div>
                </div>

                {/* Fake UI Card 3 (Status) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-border/40 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-gray-400">Estado del Sistema</span>
                    <span className="text-green-500 text-xs font-bold">● 100% Operativo</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-primary h-full w-[98%] rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION: Final CTA (High Impact) */}
      <section className="w-full py-24 px-6">
        <div className="container mx-auto">
          <div className="bg-primary rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-primary/30">
            {/* Background Pattern */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
            </div>

            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-heading font-extrabold mb-8 text-white tracking-tight">
                ¿Listo para liderar el <br /> futuro veterinario?
              </h2>
              <p className="text-xl md:text-2xl text-blue-100 mb-10 font-medium">
                Únete a las clínicas que ya dejaron atrás el caos. Empieza hoy mismo tu transformación digital.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login?mode=register">
                  <button className="px-10 py-5 bg-white text-primary text-xl font-bold rounded-full shadow-lg hover:bg-blue-50 hover:scale-105 transition-all w-full sm:w-auto">
                    Crear Cuenta Gratis
                  </button>
                </Link>
                <a 
                  href="https://wa.me/584241554495?text=Hola,%20saludos%20vengo%20de%20la%20pagina%20de%20vetinet,%20quisiera%20mas%20informacion" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-10 py-5 bg-transparent border-2 border-white text-white text-xl font-bold rounded-full hover:bg-white/10 transition-all inline-flex items-center justify-center"
                >
                  Agendar Demo
                </a>
              </div>

              <p className="mt-8 text-sm text-blue-200 uppercase tracking-widest font-bold">
                Sin tarjeta de crédito • Cancelación libre
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <PublicFooter />
    </main>
  );
}
