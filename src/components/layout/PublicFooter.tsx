"use client";

import { Instagram, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="w-full bg-slate-50 border-t border-border/40 pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-0 mb-6">
              <Link href="/" className="flex items-center gap-0">
                <div className="w-14 h-14">
                  <img src="/icono.png" alt="Vetinet Logo" className="w-full h-full object-contain" />
                </div>
                <span className="text-xl font-heading font-bold text-foreground">Vetinet</span>
              </Link>
            </div>
            <p className="text-muted-foreground mb-6">
              El sistema operativo definitivo para la medicina veterinaria moderna.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 hover:text-primary hover:shadow-sm transition-all border border-border">
                <Instagram size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 hover:text-primary hover:shadow-sm transition-all border border-border">
                <Linkedin size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 hover:text-primary hover:shadow-sm transition-all border border-border">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Links Column 1 */}
          <div>
            <h4 className="font-bold text-foreground mb-6">Producto</h4>
            <ul className="space-y-4">
              <li><Link href="/#caracteristicas" className="text-muted-foreground hover:text-primary transition-colors">Características</Link></li>
              <li><Link href="/#seguridad" className="text-muted-foreground hover:text-primary transition-colors">Seguridad</Link></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h4 className="font-bold text-foreground mb-6">Compañía</h4>
            <ul className="space-y-4">
              <li><Link href="/nosotros" className="text-muted-foreground hover:text-primary transition-colors">Nosotros</Link></li>
              <li>
                <a 
                  href="https://wa.me/584241554495?text=Hola,%20saludos%20vengo%20de%20la%20pagina%20de%20vetinet,%20quisiera%20mas%20informacion" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          {/* Links Column 3 */}
          <div>
            <h4 className="font-bold text-foreground mb-6">Legal</h4>
            <ul className="space-y-4">
              <li><Link href="/privacidad" className="text-muted-foreground hover:text-primary transition-colors">Privacidad</Link></li>
              <li><Link href="/terminos" className="text-muted-foreground hover:text-primary transition-colors">Términos</Link></li>
              <li><Link href="/cookies" className="text-muted-foreground hover:text-primary transition-colors">Cookies</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border/40 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Vetinet Systems Inc. Todos los derechos reservados.</p>
          <div className="flex flex-col md:flex-row gap-2 items-center mt-2 md:mt-0">
            <p>Hecho con ❤️ para las mascotas.</p>
            <span className="hidden md:inline">•</span>
            <p>Diseñado por: <a href="https://amgostechnologies.com" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">AmgosTechnologies</a></p>
          </div>
        </div>
      </div>
    </footer>
  );
}
