"use client";

import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { motion } from "framer-motion";
import { Mail, MessageSquare, Phone, MapPin } from "lucide-react";

export default function ContactoPage() {
  return (
    <main className="min-h-screen bg-white">
      <PublicNavbar />
      
      <section className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* Left Column: Info */}
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-5xl md:text-6xl font-heading font-extrabold text-foreground mb-8"
            >
              Estamos para <br /> <span className="text-primary">Apoyarte.</span>
            </motion.h1>
            <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
              ¿Tienes dudas sobre cómo implementar Vetinet en tu clínica? Nuestro equipo de consultores expertos está listo para ayudarte a dar el salto digital.
            </p>
            
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                  <Mail size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Correo Electrónico</h4>
                  <p className="text-muted-foreground">soporte@vetinet.com</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <Phone size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Teléfono / WhatsApp</h4>
                  <p className="text-muted-foreground">+1 (800) VETINET</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Chat en Vivo</h4>
                  <p className="text-muted-foreground">Disponible de Lunes a Viernes (9:00 - 18:00)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-50 p-8 md:p-12 rounded-[2.5rem] border border-border/50 shadow-sm"
          >
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground ml-1">Nombre Completo</label>
                  <input type="text" className="w-full px-6 py-4 rounded-2xl bg-white border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" placeholder="Ej. Dr. García" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground ml-1">Nombre de la Clínica</label>
                  <input type="text" className="w-full px-6 py-4 rounded-2xl bg-white border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" placeholder="Ej. Veterinaria San José" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground ml-1">Correo Profesional</label>
                <input type="email" className="w-full px-6 py-4 rounded-2xl bg-white border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" placeholder="doctor@clinica.com" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground ml-1">Mensaje</label>
                <textarea className="w-full px-6 py-4 rounded-2xl bg-white border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all min-h-[150px]" placeholder="¿En qué podemos ayudarte?"></textarea>
              </div>

              <button className="w-full py-5 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 transition-all">
                Enviar Mensaje
              </button>
            </form>
          </motion.div>

        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
