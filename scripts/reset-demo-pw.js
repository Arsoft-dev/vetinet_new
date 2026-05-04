
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in environment.");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function resetDemoPassword() {
    const email = 'demo@vetinet.com';
    const newPassword = 'Vetinet123*';
    
    console.log(`Setting password for ${email} to ${newPassword}...`);
    
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) return console.error('Error listing users:', listError);
    
    const user = users.find(u => u.email === email);
    if (!user) return console.error(`User ${email} not found.`);
    
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: newPassword
    });
    
    if (error) {
        console.error('Error updating password:', error);
    } else {
        console.log('Password updated successfully! ✅');
    }
}

resetDemoPassword();
