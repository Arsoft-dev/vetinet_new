const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ ERROR: DATABASE_URL not found in environment.");
    process.exit(1);
}

async function runMigration() {
    console.log("Connecting to database...");
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected! Applying migration...");

        const sql = `
-- Migration 14: Atomic Invoice Creation
CREATE OR REPLACE FUNCTION public.create_fiscal_invoice(
    p_clinic_id uuid,
    p_client_id uuid,
    p_client_name text,
    p_client_doc text,
    p_client_address text,
    p_client_email text,
    p_amount_usd numeric,
    p_exchange_rate numeric,
    p_issued_by uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invoice_number int;
    v_invoice_id uuid;
    v_invoice_data json;
BEGIN
    UPDATE public.clinics
    SET last_invoice_number = COALESCE(last_invoice_number, 0) + 1
    WHERE id = p_clinic_id
    RETURNING last_invoice_number INTO v_invoice_number;

    IF v_invoice_number IS NULL THEN
        RAISE EXCEPTION 'Clinic not found or error generating invoice number';
    END IF;

    INSERT INTO public.invoices (
        clinic_id,
        invoice_number,
        control_number,
        client_id,
        client_name,
        client_id_number,
        client_address,
        client_email,
        subtotal,
        total_amount,
        total_amount_usd,
        exchange_rate,
        currency,
        status,
        issued_by,
        created_at
    ) VALUES (
        p_clinic_id,
        v_invoice_number,
        TO_CHAR(v_invoice_number, 'FM00000000'),
        p_client_id,
        p_client_name,
        p_client_doc,
        p_client_address,
        p_client_email,
        p_amount_usd * p_exchange_rate,
        p_amount_usd * p_exchange_rate,
        p_amount_usd,
        p_exchange_rate,
        'VES',
        'paid',
        p_issued_by,
        NOW()
    )
    RETURNING id INTO v_invoice_id;

    SELECT row_to_json(i) INTO v_invoice_data FROM public.invoices i WHERE i.id = v_invoice_id;
    
    RETURN v_invoice_data;
END;
$$;

NOTIFY pgrst, 'reload schema';
        `;

        await client.query(sql);
        console.log("Migration applied successfully!");

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
}

runMigration();
