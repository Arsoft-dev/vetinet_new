"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getClinicData() {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: member } = await supabaseAdmin
        .from("clinic_members")
        .select("clinic_id, clinics(*)")
        .eq("user_id", user.id)
        .single();

    return (member?.clinics as any) || null;
}

export async function updateClinicData(formData: FormData) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "No autenticado" };

    const { data: member } = await supabaseAdmin
        .from("clinic_members")
        .select("clinic_id")
        .eq("user_id", user.id)
        .eq("role", "admin") // Only admins can update clinic data
        .single();

    if (!member) return { success: false, message: "No tienes permisos" };

    const payload = {
        name: formData.get("name") as string,
        legal_name: formData.get("legal_name") as string,
        tax_id: formData.get("tax_id") as string,
        address: formData.get("address") as string,
        phone: formData.get("phone") as string,
        email_contact: formData.get("email_contact") as string,
        website_url: formData.get("website_url") as string,
    };

    const { error } = await supabaseAdmin
        .from("clinics")
        .update(payload)
        .eq("id", member.clinic_id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/dashboard/settings");
    return { success: true };
}

export async function updateClinicLogo(formData: FormData) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "No autenticado" };

    const { data: member } = await supabaseAdmin
        .from("clinic_members")
        .select("clinic_id, role")
        .eq("user_id", user.id)
        .single();

    if (!member || member.role !== 'admin') return { success: false, message: "No tienes permisos" };

    const file = formData.get("logo") as File;
    if (!file) return { success: false, message: "No hay archivo" };

    const fileExt = file.name.split('.').pop();
    const fileName = `${member.clinic_id}-${Math.random()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
        .from("clinics")
        .upload(filePath, file);

    if (uploadError) return { success: false, message: uploadError.message };

    // Get Public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
        .from("clinics")
        .getPublicUrl(filePath);

    // Update Clinic Record
    const { error: updateError } = await supabaseAdmin
        .from("clinics")
        .update({ logo_url: publicUrl })
        .eq("id", member.clinic_id);

    if (updateError) return { success: false, message: updateError.message };

    revalidatePath("/dashboard/settings");
    return { success: true, logoUrl: publicUrl };
}

export async function getClinicMembers() {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: member } = await supabaseAdmin
        .from("clinic_members")
        .select("clinic_id")
        .eq("user_id", user.id)
        .single();

    if (!member) return [];

    const { data: members } = await supabaseAdmin
        .from("clinic_members")
        .select(`
            id,
            role,
            status,
            created_at,
            user:users!user_id(id, email, full_name)
        `)
        .eq("clinic_id", member.clinic_id);

    return members || [];
}

export async function updateClinicMember(memberId: string, payload: { role?: string, status?: string }) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };
    
    const { data: requester } = await supabaseAdmin
        .from("clinic_members")
        .select("clinic_id, role")
        .eq("user_id", user.id)
        .single();

    if (requester?.role !== 'admin') return { success: false, message: "Solo administradores" };

    const { error } = await supabaseAdmin
        .from("clinic_members")
        .update(payload)
        .eq("id", memberId)
        .eq("clinic_id", requester.clinic_id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/dashboard/settings");
    return { success: true };
}

export async function addClinicMember(data: { name: string; email: string; password: string; role: string }) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    const { data: requester } = await supabaseAdmin
        .from("clinic_members")
        .select("clinic_id, role")
        .eq("user_id", user.id)
        .single();

    if (requester?.role !== 'admin') return { success: false, message: "Solo administradores" };

    // 1. Create User in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: data.name }
    });

    if (authError) return { success: false, message: authError.message };
    const newUserId = authData.user.id;

    // 2. Insert into public.users (just in case trigger doesn't exist)
    await supabaseAdmin.from("users").upsert({
        id: newUserId,
        email: data.email,
        full_name: data.name
    }, { onConflict: "id" });

    // 3. Create Clinic Member
    const { error: memberError } = await supabaseAdmin
        .from("clinic_members")
        .insert({
            user_id: newUserId,
            clinic_id: requester.clinic_id,
            role: data.role,
            status: "active"
        });

    if (memberError) return { success: false, message: memberError.message };

    revalidatePath("/dashboard/settings");
    return { success: true };
}

export async function forceResetMemberPassword(memberId: string, newPassword: string) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    const { data: requester } = await supabaseAdmin
        .from("clinic_members")
        .select("clinic_id, role")
        .eq("user_id", user.id)
        .single();

    if (requester?.role !== 'admin') return { success: false, message: "Solo administradores" };

    // Find the target user ID from the member ID
    const { data: targetMember } = await supabaseAdmin
        .from("clinic_members")
        .select("user_id")
        .eq("id", memberId)
        .eq("clinic_id", requester.clinic_id)
        .single();

    if (!targetMember) return { success: false, message: "Miembro no encontrado" };

    // Update password
    const { error } = await supabaseAdmin.auth.admin.updateUserById(targetMember.user_id, {
        password: newPassword
    });

    if (error) return { success: false, message: error.message };
    return { success: true };
}

export async function updateCommunicationSettings(settings: any) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "No autenticado" };

    const { data: member } = await supabaseAdmin
        .from("clinic_members")
        .select("clinic_id, role")
        .eq("user_id", user.id)
        .single();

    if (!member || member.role !== 'admin') return { success: false, message: "No tienes permisos" };

    const { error } = await supabaseAdmin
        .from("clinics")
        .update({ communication_settings: settings })
        .eq("id", member.clinic_id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/dashboard/settings");
    return { success: true };
}
