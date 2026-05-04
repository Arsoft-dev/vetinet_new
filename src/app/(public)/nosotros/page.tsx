"use client";

import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { motion } from "framer-motion";
import { Heart, Shield, Zap, Target } from "lucide-react";

export default function NosotrosPage() {
  return (
    <main className="min-h-screen bg-white">
      <PublicNavbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-6xl font-heading font-extrabold text-foreground mb-6"
        >
          Redefiniendo el Futuro de la <br /> <span className="text-primary">Medicina Veterinaria.</span>
        </motion.h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Vetinet nació de la necesidad de cerrar la brecha tecnológica en el sector veterinario. No somos solo un software, somos el socio tecnológico de las clínicas que buscan la excelencia.
        </p>
      </section>

      {/* Mission & Vision */}
      <section className="bg-slate-50 py-24">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-border/50">
            <Target className="text-primary w-12 h-12 mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-4">Nuestra Misión</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Empoderar a los profesionales de la salud animal con herramientas digitales de élite que simplifiquen su gestión diaria, permitiéndoles centrarse en lo más importante: salvar vidas y mejorar el bienestar de las mascotas.
            </p>
          </div>
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-border/50">
            <Zap className="text-amber-500 w-12 h-12 mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-4">Nuestra Visión</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Convertirnos en el estándar global de gestión veterinaria, creando un ecosistema interconectado donde la información fluya de manera segura y eficiente entre clínicos, especialistas y propietarios.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4 font-heading">Nuestros Valores</h2>
          <p className="text-lg text-muted-foreground">Lo que nos impulsa a innovar cada día.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">Integridad</h3>
            <p className="text-muted-foreground">Tratamos los datos clínicos con el máximo respeto y confidencialidad.</p>
          </div>
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Heart size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">Pasión Animal</h3>
            <p className="text-muted-foreground">Cada línea de código está diseñada pensando en el bienestar de los pacientes.</p>
          </div>
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Zap size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">Innovación Constante</h3>
            <p className="text-muted-foreground">No nos conformamos. Siempre buscamos la tecnología más rápida y segura.</p>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
