import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = createAdminClient();
    
    const tables = [
        'invoice_items',
        'invoice_payments',
        'payments',
        'invoices',
        'cash_registers'
    ];

    const results = [];

    for (const table of tables) {
        // First check if table exists by doing a head select
        const { error: checkError } = await supabase.from(table).select('id').limit(1);
        if (checkError && checkError.code === 'PGRST116') {
             results.push({ table, success: false, error: "Table not found" });
             continue;
        }

        const { error } = await supabase.from(table).delete().not('id', 'is', null);
        results.push({ table, success: !error, error: error?.message });
    }

    return NextResponse.json({ message: "Cleanup completed", results });
}
