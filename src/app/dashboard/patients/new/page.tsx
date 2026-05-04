import { PatientForm } from "@/components/dashboard/patients/PatientForm";

export default function NewPatientPage() {
    return (
        <div className="max-w-5xl mx-auto space-y-6">

            <div>
                <h1 className="text-3xl font-heading font-extrabold text-foreground">Registrar Nuevo Paciente</h1>
                <p className="text-muted-foreground">Completa la ficha para dar de alta a un nuevo cliente y su mascota.</p>
            </div>

            <PatientForm />

        </div>
    );
}
