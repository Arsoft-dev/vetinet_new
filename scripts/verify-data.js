const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ ERROR: DATABASE_URL not found in environment.");
    process.exit(1);
}

async function verifyData() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

    try {
        await client.connect();

        console.log("\n=== 🧾 ÚLTIMAS 3 FACTURAS ===");
        const invRes = await client.query(`
            SELECT invoice_number, client_name, total_amount_usd, status, created_at 
            FROM invoices 
            ORDER BY created_at DESC 
            LIMIT 3
        `);
        console.table(invRes.rows);

    } catch (err) {
        console.error("Error verificando datos:", err);
    } finally {
        await client.end();
    }
}

verifyData();
