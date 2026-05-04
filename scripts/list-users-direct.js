
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ ERROR: DATABASE_URL not found in environment.");
    process.exit(1);
}

async function listUsers() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    try {
        await client.connect();
        const res = await client.query("SELECT email FROM auth.users");
        console.log('--- Users ---');
        res.rows.forEach(u => console.log(`- ${u.email}`));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

listUsers();
