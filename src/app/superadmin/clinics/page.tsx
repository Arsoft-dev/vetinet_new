import { getAllClinics } from "@/actions/superadmin";
import { ClinicsTable } from "./ClinicsTable";

export default async function ClinicsPage() {
    const res = await getAllClinics();
    const clinics = res.success ? res.clinics : [];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black tracking-tight">Gestión de Clínicas</h1>
                <p className="text-slate-400 mt-2">Administra suscripciones, cortes de servicio y planes de los clientes SaaS.</p>
            </div>

            <ClinicsTable initialClinics={clinics || []} />
        </div>
    );
}
