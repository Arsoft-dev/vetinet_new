
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugInvoice() {
    const invoiceId = 'ddba2169-424b-44e3-81b3-8ecd199545ee'; // ID from user log
    console.log(`🔎 Inspecting Invoice: ${invoiceId}`);

    // 1. Fetch RAW Invoice (No relations)
    const { data: invoice, error } = await supabaseAdmin
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

    if (error) {
        console.error('❌ Error fetching invoice (Admin):', error);
        return;
    }

    if (!invoice) {
        console.error('❌ Invoice DOES NOT EXIST in database (even for Admin)');
        return;
    }

    console.log('✅ Invoice Found (Admin):');
    console.log(`- Number: ${invoice.invoice_number}`);
    console.log(`- Clinic ID: ${invoice.clinic_id}`);
    console.log(`- Created At: ${invoice.created_at}`);

    // 2. Check Relations
    console.log('\n🔎 Checking Relations...');

    // Check Clinic
    const { data: clinic } = await supabaseAdmin
        .from('clinics')
        .select('id, name')
        .eq('id', invoice.clinic_id)
        .single();
    console.log(`- Clinic: ${clinic ? '✅ Found (' + clinic.name + ')' : '❌ NOT FOUND'}`);

    // Check Items
    const { count: itemsCount } = await supabaseAdmin
        .from('invoice_items')
        .select('*', { count: 'exact', head: true })
        .eq('invoice_id', invoiceId);
    console.log(`- Items: ${itemsCount} items found`);

    // 3. Check RLS Implications
    // We can't easily simulate RLS here without a user token, but we can infer.
    // Ensure 'clinics' table allows reading.
}

debugInvoice();
