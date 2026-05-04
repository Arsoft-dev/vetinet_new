const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ ERROR: DATABASE_URL not found in environment.");
    process.exit(1);
}

async function checkSchema() {
    console.log("Connecting to verify schema...");
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'invoices';
        `);

        console.log("--- COLUMNS IN 'invoices' TABLE ---");
        console.table(res.rows);

    } catch (err) {
        console.error("Schema check failed:", err);
    } finally {
        await client.end();
    }
}

checkSchema();
