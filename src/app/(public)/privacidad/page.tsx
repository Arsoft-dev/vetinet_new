"use client";

import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { motion } from "framer-motion";

export default function PrivacidadPage() {
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
            Política de Privacidad
          </h1>
          
          <div className="prose prose-slate max-w-none space-y-8 text-lg text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Introducción</h2>
              <p>
                En Vetinet, la privacidad y seguridad de los datos de nuestros clientes y sus pacientes es nuestra prioridad absoluta. Esta Política de Privacidad describe cómo recopilamos, utilizamos y protegemos la información personal y médica dentro de nuestra plataforma SaaS.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">2. Información que Recopilamos</h2>
              <p>
                Recopilamos información necesaria para la gestión clínica, incluyendo:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Datos de la Clínica:</strong> Nombre, dirección, contacto y credenciales administrativas.</li>
                <li><strong>Datos del Propietario:</strong> Información de contacto para recordatorios y comunicaciones.</li>
                <li><strong>Información del Paciente:</strong> Historial médico, vacunas, diagnósticos y tratamientos veterinarios.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">3. Uso de la Información</h2>
              <p>
                La información recopilada se utiliza exclusivamente para:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Proveer el servicio de gestión clínica contratado.</li>
                <li>Automatizar recordatorios de citas y tratamientos.</li>
                <li>Mejorar la experiencia de usuario y el soporte técnico.</li>
                <li>Garantizar la seguridad y prevenir fraudes.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Protección y Seguridad de Datos</h2>
              <p>
                Vetinet implementa medidas de seguridad de grado industrial, incluyendo encriptación de datos en tránsito (SSL/TLS) y en reposo. El acceso a la información médica está restringido mediante roles definidos por la propia clínica.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Confidencialidad Médica</h2>
              <p>
                Entendemos la sensibilidad de la información veterinaria. Vetinet se compromete a no compartir, vender ni alquilar datos médicos de pacientes a terceros sin el consentimiento explícito de la clínica, salvo por requerimientos legales.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Contacto</h2>
              <p>
                Para cualquier duda sobre el tratamiento de sus datos, puede contactarnos a través de nuestro soporte técnico oficial.
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
