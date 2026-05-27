import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jldmbnvywtxofvllkofh.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: roles } = await supabase.from('clinic_members').select('role');
    const uniqueRoles = [...new Set(roles?.map(r => r.role) || [])];
    console.log("Unique roles:", uniqueRoles);
}

check();
