
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in environment.");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function listUsers() {
    console.log('Fetching users from:', supabaseUrl);
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
        console.error('Error listing users:', error);
        return;
    }
    console.log('--- Users ---');
    users.forEach(u => console.log(`- ${u.email}`));
}

listUsers();
