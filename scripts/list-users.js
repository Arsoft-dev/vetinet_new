
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listUsers() {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
        console.error('Error listing users:', error);
        return;
    }
    console.log('--- Users ---');
    users.forEach(u => console.log(`- ${u.email}`));
}

listUsers();
