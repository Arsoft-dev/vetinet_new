"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updateExchangeRateSettings({ mode, manualRate, preferredCurrency }: { mode: 'auto_bcv' | 'auto_euro' | 'manual', manualRate?: number, preferredCurrency?: string }) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "No autenticado" };

    // 1. Get clinic ID
    const { data: member } = await supabaseAdmin
        .from("clinic_members")
        .select("clinic_id, clinics(settings)")
        .eq("user_id", user.id)
        .single();

    if (!member) return { success: false, message: "No eres miembro de una clínica" };
    
    const currentSettings = (member.clinics as any)?.settings || {};
    const newSettings = {
        ...currentSettings,
        exchange_rate_mode: mode,
        manual_rate: manualRate || currentSettings.manual_rate || 54.50,
        preferred_currency: preferredCurrency || currentSettings.preferred_currency || 'USD'
    };

    // 2. Update clinic settings
    const { error } = await supabaseAdmin
        .from("clinics")
        .update({ settings: newSettings })
        .eq("id", member.clinic_id);

    if (error) {
        console.error("Error updating clinic settings:", error);
        return { success: false, message: error.message };
    }

    revalidatePath("/dashboard/billing");
    revalidatePath("/");
    
    return { success: true };
}

export async function updateClinicSettings(settings: any) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "No autenticado" };

    const { data: member } = await supabaseAdmin
        .from("clinic_members")
        .select("clinic_id, role, clinics(settings)")
        .eq("user_id", user.id)
        .single();

    if (!member || member.role !== 'admin') return { success: false, message: "No eres admin" };
    
    const currentSettings = (member.clinics as any)?.settings || {};
    const newSettings = {
        ...currentSettings,
        ...settings
    };

    const { error } = await supabaseAdmin
        .from("clinics")
        .update({ settings: newSettings })
        .eq("id", member.clinic_id);

    if (error) {
        console.error("Error updating clinic settings:", error);
        return { success: false, message: error.message };
    }

    revalidatePath("/dashboard/settings");
    
    return { success: true };
}
