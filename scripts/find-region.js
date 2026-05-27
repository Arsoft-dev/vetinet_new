const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
let connectionString = process.env.DATABASE_URL;

if (!connectionString && fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split(/\r?\n/);
    const dbLine = lines.find(line => line.startsWith('DATABASE_URL='));
    if (dbLine) {
        connectionString = dbLine.substring('DATABASE_URL='.length).trim();
    }
}

if (!connectionString) {
    console.error("❌ DATABASE_URL no encontrada.");
    process.exit(1);
}

// Extraer credenciales de la URL
const match = connectionString.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
if (!match) {
    console.error("❌ No se pudo parsear DATABASE_URL.");
    process.exit(1);
}

const [_, user, password, originalHost, port, db] = match;

const regions = [
    'sa-east-1',
    'us-east-1',
    'us-east-2',
    'us-west-1',
    'us-west-2',
    'eu-west-1',
    'eu-west-2',
    'eu-west-3',
    'eu-central-1',
    'ap-southeast-1',
    'ap-southeast-2',
    'ap-northeast-1',
    'ap-northeast-2'
];

async function testRegion(region) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const url = `postgresql://${user}:${password}@${host}:${port}/${db}`;
    
    console.log(`Probando región: ${region} (${host})...`);
    const client = new Client({
        connectionString: url,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000 // 5 segundos
    });

    try {
        await client.connect();
        console.log(`✅ ¡ÉXITO! Región correcta encontrada: ${region}`);
        await client.end();
        return true;
    } catch (err) {
        const msg = err.message || '';
        if (msg.includes('password authentication failed')) {
            console.log(`🔶 Región correcta (${region}) pero falló la contraseña.`);
            await client.end();
            return true;
        } else if (msg.includes('tenant/user') && msg.includes('not found')) {
            // El pooler respondió que el tenant no existe en esta región, esto es normal para regiones incorrectas.
        } else {
            console.log(`❌ Error en ${region}: ${msg}`);
        }
        try {
            await client.end();
        } catch (e) {}
        return false;
    }
}

async function start() {
    console.log("Iniciando búsqueda de la región de Supabase...");
    for (const region of regions) {
        const found = await testRegion(region);
        if (found) {
            console.log(`\n🎉 Búsqueda completada. La región del pooler es: ${region}`);
            process.exit(0);
        }
    }
    console.log("\n❌ No se encontró ninguna región compatible.");
}

start();
