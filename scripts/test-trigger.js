const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ ERROR: DATABASE_URL not found in environment.");
    process.exit(1);
}

async function testTrigger() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

    try {
        await client.connect();
        console.log("Connected. Testing Inventory Trigger...");

        const prodRes = await client.query(`
            SELECT p.id, p.name, SUM(b.quantity) as total_stock 
            FROM products p
            JOIN inventory_batches b ON p.id = b.product_id
            GROUP BY p.id, p.name
            HAVING SUM(b.quantity) > 0
            LIMIT 1;
        `);

        if (prodRes.rows.length === 0) {
            console.log("No products with stock found to test.");
            return;
        }

        const product = prodRes.rows[0];
        console.log(`\nTARGET PRODUCT: ${product.name} (ID: ${product.id})`);

        const clinicRes = await client.query("SELECT id FROM clinics LIMIT 1");
        const clinicId = clinicRes.rows[0].id;

        const insertRes = await client.query(`
            INSERT INTO inventory_transactions 
            (clinic_id, product_id, transaction_type, quantity, notes, created_by)
            VALUES ($1, $2, 'sale', -1, 'TEST TRIGGER', NULL)
            RETURNING id;
        `, [clinicId, product.id]);

        console.log(`Transaction Created ID: ${insertRes.rows[0].id}`);

    } catch (err) {
        console.error("Test Error:", err);
    } finally {
        await client.end();
    }
}

testTrigger();
