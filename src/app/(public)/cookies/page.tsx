"use client";

import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { motion } from "framer-motion";

export default function CookiesPage() {
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
            Política de Cookies
          </h1>
          
          <div className="prose prose-slate max-w-none space-y-8 text-lg text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">¿Qué son las cookies?</h2>
              <p>
                Las cookies son pequeños archivos de texto que los sitios web almacenan en su navegador para recordar información sobre su visita. En Vetinet, las utilizamos para que la plataforma funcione de manera eficiente y segura.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Tipos de Cookies que utilizamos</h2>
              <ul className="list-disc pl-6 space-y-4">
                <li>
                  <strong>Cookies Esenciales:</strong> Necesarias para el funcionamiento básico del SaaS, como el inicio de sesión, la seguridad de la sesión y la gestión de permisos. Sin estas cookies, la plataforma no podría operar.
                </li>
                <li>
                  <strong>Cookies de Preferencias:</strong> Nos permiten recordar sus ajustes personalizados, como el idioma o el tema visual (Claro/Oscuro).
                </li>
                <li>
                  <strong>Cookies de Rendimiento:</strong> Nos ayudan a entender cómo se utiliza el sistema para optimizar la velocidad y corregir errores técnicos.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Control de Cookies</h2>
              <p>
                Usted puede configurar su navegador para bloquear o eliminar las cookies en cualquier momento. Sin embargo, tenga en cuenta que deshabilitar las cookies esenciales impedirá el uso correcto de las herramientas de gestión de Vetinet.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Cookies de Terceros</h2>
              <p>
                Utilizamos servicios analíticos limitados y de seguridad que pueden establecer sus propias cookies para ayudarnos a proteger la plataforma contra ataques malintencionados.
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
