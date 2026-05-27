import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCriticalStockAlertEmail } from "@/actions/emails";
import { generateStockAlertPDF } from "@/actions/pdf-generator";

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    const supabaseAdmin = createAdminClient();

    try {
        // 1. Obtener todas las clínicas activas
        const { data: clinics, error: clinicsErr } = await supabaseAdmin
            .from("clinics")
            .select("id, name, email_contact");

        if (clinicsErr) throw clinicsErr;

        let processed = 0;
        let emailsSent = 0;
        const results = [];

        // 2. Procesar inventario para cada clínica
        for (const clinic of clinics || []) {
            if (!clinic.email_contact) {
                // Si la clínica no tiene email de contacto configurado, saltamos o enviamos a los admins.
                // Por ahora saltaremos para mantenerlo simple.
                results.push({ clinicId: clinic.id, status: 'no_email' });
                continue;
            }

            // 3. Obtener productos de la clínica
            const { data: products } = await supabaseAdmin
                .from("products")
                .select("id, name, min_stock_level, unit")
                .eq("clinic_id", clinic.id)
                .eq("is_archived", false);

            if (!products || products.length === 0) continue;

            // 4. Obtener todos los lotes de la clínica (stock global)
            const { data: batches } = await supabaseAdmin
                .from("inventory_batches")
                .select("product_id, quantity")
                .in("product_id", products.map(p => p.id));

            // Mapear stock global por producto
            const stockMap = new Map<string, number>();
            batches?.forEach(b => {
                const current = stockMap.get(b.product_id) || 0;
                stockMap.set(b.product_id, current + Number(b.quantity));
            });

            // 5. Identificar productos críticos
            const criticalItems: Array<{ name: string; currentStock: number; minStock: number; unit: string }> = [];

            products.forEach(p => {
                const stock = stockMap.get(p.id) || 0;
                const minStock = p.min_stock_level || 5;

                if (stock <= minStock) {
                    criticalItems.push({
                        name: p.name,
                        currentStock: stock,
                        minStock: minStock,
                        unit: p.unit || 'uds'
                    });
                }
            });

            // 6. Si hay items críticos, generar PDF y enviar alerta
            if (criticalItems.length > 0) {
                let pdfBuffer: Buffer | undefined;
                try {
                    pdfBuffer = await generateStockAlertPDF(clinic.name, criticalItems);
                } catch (pdfErr) {
                    console.error(`Error generando PDF para clínica ${clinic.name}:`, pdfErr);
                }

                const emailResult = await sendCriticalStockAlertEmail({
                    email: clinic.email_contact,
                    clinicName: clinic.name,
                    items: criticalItems,
                    pdfBuffer
                });

                if (emailResult.success) {
                    emailsSent++;
                    results.push({ clinicId: clinic.id, status: 'sent', criticalItemsCount: criticalItems.length });
                } else {
                    results.push({ clinicId: clinic.id, status: 'error', error: emailResult.error });
                }
            } else {
                results.push({ clinicId: clinic.id, status: 'ok_stock' });
            }

            processed++;
        }

        return NextResponse.json({ 
            success: true,
            processedClinics: processed,
            emailsSent: emailsSent,
            results 
        });

    } catch (error: any) {
        console.error("Inventory Alert Cron Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
