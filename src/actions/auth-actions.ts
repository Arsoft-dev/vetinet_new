"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateOwnPassword(newPassword: string) {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
        return { success: false, message: error.message };
    }

    return { success: true };
}
