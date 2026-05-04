"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "No autenticado" };

    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;

    // 1. Update public.users table
    const { error: profileError } = await supabaseAdmin
        .from("users")
        .update({ 
            full_name: fullName,
            // phone: phone // We'll try to update it, if it fails we skip
        })
        .eq("id", user.id);

    if (profileError) {
        console.error("Profile update error:", profileError);
        return { success: false, message: profileError.message };
    }

    // 2. Update Auth Metadata (for immediate UI reflect in Header)
    const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName }
    });

    if (authError) {
        console.error("Auth metadata update error:", authError);
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
}

export async function updateAvatar(formData: FormData) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "No autenticado" };

    const file = formData.get("avatar") as File;
    if (!file) return { success: false, message: "No hay archivo" };

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // 1. Upload to Supabase Storage (assuming 'users' bucket exists)
    // If 'users' bucket doesn't exist, we might use 'clinics' or generic 'avatars'
    const { error: uploadError } = await supabaseAdmin.storage
        .from("clinics") // Reusing clinics bucket if a dedicated one doesn't exist
        .upload(filePath, file);

    if (uploadError) return { success: false, message: uploadError.message };

    // 2. Get Public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
        .from("clinics")
        .getPublicUrl(filePath);

    // 3. Update User Record
    const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

    if (updateError) return { success: false, message: updateError.message };

    // 4. Update Auth Metadata
    await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
    });

    revalidatePath("/dashboard/settings");
    return { success: true, avatarUrl: publicUrl };
}
