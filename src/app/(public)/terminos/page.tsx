"use client";

import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { motion } from "framer-motion";

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-white">
      <PublicNavbar />
      
      <div className="container mx-auto px-6 py-20 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-foreground mb-8">
            Términos y Condiciones de Uso
          </h1>
          
          <div className="prose prose-slate max-w-none space-y-8 text-lg text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Aceptación de los Términos</h2>
              <p>
                Al acceder y utilizar la plataforma Vetinet, usted acepta estar sujeto a estos términos y condiciones. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">2. Descripción del Servicio</h2>
              <p>
                Vetinet es un software como servicio (SaaS) diseñado para la gestión integral de clínicas veterinarias. El servicio incluye la gestión de historias clínicas, agenda, hospitalización, facturación y comunicación con propietarios de mascotas.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">3. Responsabilidad del Usuario</h2>
              <p>
                El usuario (clínica o profesional veterinario) es responsable de:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Mantener la confidencialidad de sus credenciales de acceso.</li>
                <li>La veracidad y legalidad de la información médica ingresada.</li>
                <li>El cumplimiento de las normativas veterinarias locales de su jurisdicción.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Disponibilidad del Servicio</h2>
              <p>
                Vetinet se esfuerza por mantener una disponibilidad del 99.9%. Sin embargo, el servicio puede interrumpirse por mantenimientos programados o causas de fuerza mayor. Contamos con sistemas de redundancia para minimizar cualquier tiempo de inactividad.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Propiedad Intelectual</h2>
              <p>
                Todo el software, diseño, logotipos y contenidos de Vetinet son propiedad exclusiva de Vetinet Systems Inc. El usuario conserva la propiedad de todos los datos clínicos ingresados por él en la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Limitación de Responsabilidad</h2>
              <p>
                Vetinet es una herramienta de apoyo a la gestión. Las decisiones médicas finales y el tratamiento de los pacientes son responsabilidad exclusiva del profesional veterinario a cargo.
              </p>
            </section>

            <p className="pt-8 text-sm font-bold italic">
              Última actualización: {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </motion.div>
      </div>

      <PublicFooter />
    </main>
  );
}
