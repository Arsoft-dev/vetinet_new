// Script de prueba para diagnosticar la conexión con Supabase Postgres.
// Intenta conectarse a través de diferentes variantes de host y credenciales.

const { Client } = require('pg');

const projectRef = "ewxaywsqvmbubtypmcin";
const dbPassword = "Kali2033.."; // Contraseña SMTP/Database del proyecto

const connections = [
    {
        label: "Direct Connection (db.project.supabase.co:5432)",
        config: {
            connectionString: `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`,
            ssl: { rejectUnauthorized: false }
        }
    },
    {
        label: "Pooler Connection (aws-0-sa-east-1.pooler.supabase.com:6543)",
        config: {
            connectionString: `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`,
            ssl: { rejectUnauthorized: false }
        }
    },
    {
        label: "Pooler Connection Session (aws-0-sa-east-1.pooler.supabase.com:5432)",
        config: {
            connectionString: `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`,
            ssl: { rejectUnauthorized: false }
        }
    }
];

async function testAll() {
    for (const conn of connections) {
        console.log(`\nProbando conexión: ${conn.label}...`);
        const client = new Client(conn.config);
        try {
            await client.connect();
            console.log(`✅ ¡ÉXITO! Conexión lograda.`);
            const res = await client.query("SELECT NOW()");
            console.log(`Hora del servidor: ${res.rows[0].now}`);
            await client.end();
            console.log(`Conexión cerrada.`);
            // Si funciona una, mostramos la URL sugerida y terminamos
            console.log(`\nUse esta conexión para la migración.`);
            process.exit(0);
        } catch (err) {
            console.error(`❌ Falló: ${err.message}`);
            try {
                await client.end();
            } catch (e) {}
        }
    }
    console.log("\n❌ Todas las conexiones de prueba fallaron.");
    process.exit(1);
}

testAll();
