"use client";

import Link from "next/link";

export function PublicNavbar() {
  return (
    <nav className="relative z-10 container mx-auto px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-0">
        <Link href="/" className="flex items-center gap-0">
          <div className="w-28 h-28 flex items-center justify-center -mr-2">
            <img src="/icono.png" alt="Vetinet Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-3xl font-heading font-extrabold text-foreground tracking-tight">Vetinet</span>
        </Link>
      </div>
      <div className="hidden md:flex gap-8">
        {/* Los enlaces centrales fueron removidos por solicitud del usuario */}
      </div>
      <Link href="/login">
        <button className="bg-white text-primary px-6 py-2.5 rounded-full border border-primary/20 shadow-sm hover:bg-primary/5 transition-all font-bold">
          Acceso Clientes
        </button>
      </Link>
    </nav>
  );
}
