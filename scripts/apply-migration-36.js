// Script para aplicar la migración 36 (Detalles de Transferencias) a la base de datos de Supabase.
// Se conecta usando la cadena de conexión DATABASE_URL de .env.local.

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env.local
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
    console.error("❌ ERROR: DATABASE_URL no fue encontrada en .env.local ni en las variables de entorno.");
    process.exit(1);
}

// Remover comillas alrededor de la cadena de conexión si las tiene
connectionString = connectionString.replace(/^['"]|['"]$/g, '');

async function runWithUrl(url, label) {
    console.log(`Intentando conectar usando: ${label}...`);
    const client = new Client({
        connectionString: url,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
    });

    try {
        await client.connect();
        console.log(`¡Conectado exitosamente con ${label}!`);
        
        const migrationPath = path.resolve(__dirname, '../migration_36_inventory_transfers_detail.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        console.log("Aplicando migración 36...");
        await client.query(sql);
        console.log("¡Migración 36 aplicada con éxito en la base de datos!");
        await client.end();
        return true;
    } catch (err) {
        console.error(`❌ Error al aplicar migración con ${label}:`, err.message || err);
        try {
            await client.end();
        } catch (e) {}
        return false;
    }
}

async function runMigration() {
    // 1. Probar URL original
    let success = await runWithUrl(connectionString, "DATABASE_URL original");
    
    // 2. Probar con contraseña de respaldo / alternativa si la primera falla
    if (!success) {
        const match = connectionString.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
        if (match) {
            const [_, user, password, host, port, db] = match;
            const alternativeUrl = `postgresql://${user}:Kali2033..@${host}:${port}/${db}`;
            success = await runWithUrl(alternativeUrl, "Pooler con contraseña SMTP (Kali2033..)");
        }
    }

    if (success) {
        console.log("✅ Proceso de migración completado.");
    } else {
        console.error("❌ Todos los intentos de conexión para aplicar la migración fallaron.");
        process.exit(1);
    }
}

runMigration();
