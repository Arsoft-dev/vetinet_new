import { NextResponse } from "next/server";
import { sendCriticalStockAlertEmail } from "@/actions/emails";
import { generateStockAlertPDF } from "@/actions/pdf-generator";

export async function GET() {
    try {
        const items = [
            { name: "Vacuna Antirrábica Nobivac", currentStock: 2, minStock: 15, unit: "viales" },
            { name: "Perrarina ProPlan Adulto 15kg", currentStock: 1, minStock: 5, unit: "sacos" },
            { name: "Jeringas Descartables 3ml", currentStock: 12, minStock: 100, unit: "unidades" },
            { name: "Anestesia Ketamina 50ml", currentStock: 0, minStock: 3, unit: "frascos" }
        ];

        const pdfBuffer = await generateStockAlertPDF("Clínica Veterinaria Demo", items);

        const emailResult = await sendCriticalStockAlertEmail({
            email: "abrahanruiz1@gmail.com",
            clinicName: "Clínica Veterinaria Demo",
            items: items,
            pdfBuffer
        });

        return NextResponse.json({ success: true, message: "Correo enviado con éxito", emailResult });
    } catch (error: any) {
        console.error("Test Email Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
