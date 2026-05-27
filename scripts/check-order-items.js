const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
let supabaseUrl, supabaseServiceKey;

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split(/\r?\n/);
    const urlLine = lines.find(line => line.startsWith('NEXT_PUBLIC_SUPABASE_URL='));
    if (urlLine) supabaseUrl = urlLine.substring('NEXT_PUBLIC_SUPABASE_URL='.length).trim();
    const serviceLine = lines.find(line => line.startsWith('SUPABASE_SERVICE_ROLE_KEY='));
    if (serviceLine) supabaseServiceKey = serviceLine.substring('SUPABASE_SERVICE_ROLE_KEY='.length).trim();
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
    console.log("Consultando purchase_order_items:");
    const { data, error } = await supabaseAdmin
        .from('purchase_order_items')
        .select('*');

    if (error) {
        console.error("❌ Error:", error);
    } else {
        console.log(`✅ Encontrados ${data.length} ítems en total:`);
        console.table(data);
    }
}

test();
