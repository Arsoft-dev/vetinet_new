"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getInvoices(limit = 10) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: invoices, error } = await supabase
        .from("invoices")
        .select(`
            *,
            client:clients(full_name, identification_doc)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Error fetching invoices:", error.message || error);
        return [];
    }
    return invoices;
}

import { syncExchangeRate, getLatestRate } from "./exchange-rates";

export async function getExchangeRate() {
    // 1. Trigger lazy sync (checks if update is needed internally)
    await syncExchangeRate();
    
    // 2. Return the most recent rate from our DB
    return await getLatestRate();
}

export async function createInvoice({ clientId, items, totalUSD, exchangeRate, taxes, payments, cashRegisterId, medicalRecordId }: {
    clientId: string,
    items: { productId: string, quantity: number, unitPrice: number, name?: string, fromConsultation?: boolean }[],
    totalUSD: number,
    exchangeRate: number,
    taxes?: {
        subtotal: number,
        exemptAmount: number,
        taxableAmount: number,
        ivaAmount: number,
        igtfAmount: number
    },
    payments?: any[],
    cashRegisterId?: string
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "No autenticado" };

    // 1. Get user's clinic
    const supabaseAdmin = createAdminClient();
    const { data: member } = await supabaseAdmin.from("clinic_members").select("clinic_id").eq("user_id", user.id).single();
    if (!member) return { success: false, message: "No pertenece a una clínica" };

    // 1.5 Get Client Details
    let dbClientName = 'Cliente Mostrador';
    let dbClientDoc = 'V00000000';
    let dbClientAddress = 'Ciudad';
    let dbClientEmail = null;

    if (clientId) {
        const { data: clientData } = await supabaseAdmin.from("clients").select("*").eq("id", clientId).single();
        if (clientData) {
            dbClientName = clientData.full_name || 'Cliente sin nombre';
            dbClientDoc = clientData.identification_doc || 'V00000000';
            dbClientAddress = clientData.address || 'Ciudad';
            dbClientEmail = clientData.email;
        }
    }

    // 2. Create Invoice using Atomic RPC (Safe Sequence Generation)
    const { data: invoice, error: rpcError } = await supabaseAdmin.rpc('create_fiscal_invoice', {
        p_clinic_id: member.clinic_id,
        p_client_id: clientId || null,
        p_client_name: dbClientName || null,
        p_client_doc: dbClientDoc || null,
        p_client_address: dbClientAddress || null,
        p_client_email: dbClientEmail || null,
        p_amount_usd: totalUSD,
        p_exchange_rate: exchangeRate,
        p_issued_by: user.id,
        p_subtotal_usd: taxes?.subtotal || totalUSD,
        p_exempt_amount_usd: taxes?.exemptAmount || 0,
        p_taxable_amount_usd: taxes?.taxableAmount || 0,
        p_iva_amount_usd: taxes?.ivaAmount || 0,
        p_igtf_amount_usd: taxes?.igtfAmount || 0,
        p_cash_register_id: cashRegisterId || null,
        p_payments: payments || []
    });

    if (rpcError) {
        console.error("RPC Error creating invoice:", rpcError);
        return { success: false, message: rpcError.message || "Error al generar factura fiscal" };
    }

    // Check if invoice was returned
    if (!invoice) return { success: false, message: "No se pudo crear la factura (RPC null)" };

    // 3. Create Invoice Items and Record Inventory Transactions
    const invoiceItems = [];
    const inventoryTransactions = [];

    for (const item of items) {
        // Prepare Invoice Item (Matching Schema from Migration 11 / Nuclear Option)
        // Schema: invoice_id, product_id, description, quantity, unit_price, total_price
        invoiceItems.push({
            invoice_id: invoice.id,
            product_id: item.productId,
            description: item.name || 'Producto General', // Fallback if name missing
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.quantity * item.unitPrice
            // Note: Removed 'tax_aliquot' as it might not be in the manual schema the user ran.
            // If the user ran Migration 11 original, it has tax_aliquot default.
            // If the user ran 'Nuclear Option', it DOES NOT have tax_aliquot.
            // Safest is to OMIT it and let DB default or NULL (if nullable, but it was missing in nuclear CREATE).
        });

        // Prepare Inventory Transaction (Sale = Negative Quantity)
        // ONLY if it doesn't come from a consultation (where it was already deducted)
        if (!item.fromConsultation) {
            inventoryTransactions.push({
                clinic_id: member.clinic_id,
                product_id: item.productId,
                transaction_type: 'sale',
                quantity: -item.quantity, // Negative for deduction
                reference_id: invoice.id,
                reference_type: 'invoice',
                created_by: user.id
            });
        }
    }

    const { error: itemsError } = await supabaseAdmin.from("invoice_items").insert(invoiceItems);

    if (itemsError) {
        console.error("Error creating items", itemsError);
        // Important: If items fail, the invoice header remains (orphan). 
        // ideally we should delete it, but for now just error out.
        return { success: false, message: `Error al guardar ítems: ${itemsError.message}` };
    }

    // 4. Execute Inventory Transactions (Triggers Stock Deduction)
    if (inventoryTransactions.length > 0) {
        const { error: stockError } = await supabaseAdmin.from("inventory_transactions").insert(inventoryTransactions);

        if (stockError) {
            console.error("Error updating stock", stockError);
            // Note: Invoice exists but stock failed. In production use transaction/rollback.
            return { success: true, invoice, warning: "Factura creada pero hubo error al descontar inventario" };
        }
    }

    // 5. Update Medical Record Status if applicable
    if (medicalRecordId) {
        await supabaseAdmin
            .from("medical_records")
            .update({ billing_status: 'billed' })
            .eq("id", medicalRecordId);
        revalidatePath("/dashboard/patients");
    }

    revalidatePath("/dashboard/billing");
    revalidatePath("/dashboard/inventory");

    return { success: true, invoice };
}
