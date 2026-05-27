const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
let supabaseUrl, supabaseAnonKey;

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split(/\r?\n/);
    
    const urlLine = lines.find(line => line.startsWith('NEXT_PUBLIC_SUPABASE_URL='));
    if (urlLine) supabaseUrl = urlLine.substring('NEXT_PUBLIC_SUPABASE_URL='.length).trim();
    
    const keyLine = lines.find(line => line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY='));
    if (keyLine) supabaseAnonKey = keyLine.substring('NEXT_PUBLIC_SUPABASE_ANON_KEY='.length).trim();
}

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ ERROR: Supabase URL o Anon Key no encontradas.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    console.log("Conectando a la API de Supabase...");
    const { data, error } = await supabase.from('suppliers').select('count');
    if (error) {
        console.error("❌ Error de API Supabase:", error.message || error);
    } else {
        console.log("✅ Conexión HTTP Supabase exitosa. Proveedores actuales:", data);
    }
}

test();
