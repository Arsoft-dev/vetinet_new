import { createClient } from "@supabase/supabase-js";

// Note: This client has ADMIN privileges. Use only in secure server-side contexts.
// NEVER import this in client components.

export const createAdminClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
};
