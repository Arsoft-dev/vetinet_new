import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PrintTrigger } from "@/components/dashboard/print/PrintTrigger";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { InvoiceTemplate } from "@/components/dashboard/print/InvoiceTemplate";

export default async function PrintInvoicePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    console.log("🖨️ Print Invoice Page Hit. ID:", id);

    const supabase = await createClient();

    // Check Auth
    const { data: { user } } = await supabase.auth.getUser();
    console.log("👤 User Authenticated:", user?.id || "No User");

    // 1. Fetch Invoice Core Only (No Relations)
    const { data: invoiceRaw, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .single();

    if (invoiceError || !invoiceRaw) {
        console.error("❌ Core Invoice Fetch Error:", invoiceError);
        return <div className="p-10 text-red-600 font-bold text-center">Error: Factura no encontrada o sin acceso (Posible bloqueo RLS).</div>;
    }

    // 2. Fetch Relations Separately
    const { data: items } = await supabase
        .from("invoice_items")
        .select("id, description, quantity, unit_price, total_price, product_id")
        .eq("invoice_id", id);

    const { data: clinic } = await supabase
        .from("clinics")
        .select("name, address, phone, logo_url, rif")
        .eq("id", invoiceRaw.clinic_id)
        .single();

    // 3. Assemble Final Object
    const invoice = {
        ...invoiceRaw,
        items: items || [],
        clinic: clinic || null,
        client_name: invoiceRaw.client_name,
        client_id_number: invoiceRaw.client_id_number
    };

    // If we reached here, we have at least the invoice
    if (false) {
        // Legacy error block ignored
    }

    // Render Client Component
    return <InvoiceTemplate invoice={invoice} />;
}
