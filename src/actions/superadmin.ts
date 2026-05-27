"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

// Helper to check if current user is superadmin
export async function isSuperAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    if (user.email === 'abrahanruiz1@gmail.com') return true;

    const supabaseAdmin = createAdminClient();
    const { data } = await supabaseAdmin
        .from("users")
        .select("is_superadmin")
        .eq("id", user.id)
        .single();
        
    return data?.is_superadmin === true;
}

export async function getGlobalMetrics() {
    const isSA = await isSuperAdmin();
    if (!isSA) return { success: false, message: "No autorizado" };

    const supabaseAdmin = createAdminClient();

    // Total Clinics
    const { count: totalClinics } = await supabaseAdmin
        .from("clinics")
        .select("*", { count: 'exact', head: true });

    // Active Clinics
    const { count: activeClinics } = await supabaseAdmin
        .from("clinics")
        .select("*", { count: 'exact', head: true })
        .eq("subscription_status", "active");

    // Total Patients
    const { count: totalPatients } = await supabaseAdmin
        .from("pets")
        .select("*", { count: 'exact', head: true });

    // Total Invoices / MRR (Rough estimate for now)
    const { data: invoices } = await supabaseAdmin
        .from("invoices")
        .select("total_usd")
        .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    const currentMonthRevenue = invoices?.reduce((acc, curr) => acc + (curr.total_usd || 0), 0) || 0;

    return {
        success: true,
        metrics: {
            totalClinics: totalClinics || 0,
            activeClinics: activeClinics || 0,
            totalPatients: totalPatients || 0,
            currentMonthRevenue
        }
    };
}

export async function getAllClinics() {
    const isSA = await isSuperAdmin();
    if (!isSA) return { success: false, message: "No autorizado" };

    const supabaseAdmin = createAdminClient();
    const { data: clinics, error } = await supabaseAdmin
        .from("clinics")
        .select(`
            id, name, legal_name, email_contact, phone, 
            subscription_plan, subscription_status, subscription_end_date, created_at,
            billing_enabled
        `)
        .order("created_at", { ascending: false });

    if (error) return { success: false, message: error.message };
    
    return { success: true, clinics };
}

export async function updateClinicSubscription(clinicId: string, plan: string, status: string) {
    const isSA = await isSuperAdmin();
    if (!isSA) return { success: false, message: "No autorizado" };

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
        .from("clinics")
        .update({
            subscription_plan: plan,
            subscription_status: status
        })
        .eq("id", clinicId);

    if (error) return { success: false, message: error.message };

    revalidatePath("/superadmin/clinics");
    return { success: true };
}

export async function toggleClinicBilling(clinicId: string, enabled: boolean) {
    const isSA = await isSuperAdmin();
    if (!isSA) return { success: false, message: "No autorizado" };

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
        .from("clinics")
        .update({ billing_enabled: enabled })
        .eq("id", clinicId);

    if (error) return { success: false, message: error.message };

    revalidatePath("/superadmin/clinics");
    revalidatePath("/dashboard", "layout");
    return { success: true };
}

export async function renewSubscription(clinicId: string, months: number) {
    const isSA = await isSuperAdmin();
    if (!isSA) return { success: false, message: "No autorizado" };

    const supabaseAdmin = createAdminClient();
    
    // Get current clinic end date
    const { data: clinic } = await supabaseAdmin
        .from("clinics")
        .select("subscription_end_date")
        .eq("id", clinicId)
        .single();
        
    let newEndDate = new Date();
    
    // If they still have active time, add to it. Otherwise, start from today.
    if (clinic?.subscription_end_date && new Date(clinic.subscription_end_date) > new Date()) {
        newEndDate = new Date(clinic.subscription_end_date);
    }
    
    newEndDate.setMonth(newEndDate.getMonth() + months);

    const { error } = await supabaseAdmin
        .from("clinics")
        .update({
            subscription_end_date: newEndDate.toISOString(),
            subscription_status: 'active' // Auto-activate if it was suspended
        })
        .eq("id", clinicId);

    if (error) return { success: false, message: error.message };

    revalidatePath("/superadmin/clinics");
    return { success: true, newDate: newEndDate.toISOString() };
}

export async function impersonateClinic(clinicId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: false, message: "No autenticado" };

    const isSA = await isSuperAdmin();
    if (!isSA) return { success: false, message: "No autorizado" };

    const supabaseAdmin = createAdminClient();

    // Ensure the user exists in public.users to avoid foreign key constraints
    await supabaseAdmin
        .from("users")
        .upsert({
            id: user.id,
            email: user.email,
            full_name: "Super Admin",
            is_superadmin: true
        });

    // Remove superadmin from any existing clinics to ensure clean entry
    await supabaseAdmin
        .from("clinic_members")
        .delete()
        .eq("user_id", user.id);

    // Add superadmin to target clinic as admin
    const { error } = await supabaseAdmin
        .from("clinic_members")
        .insert({
            user_id: user.id,
            clinic_id: clinicId,
            role: 'admin',
            status: 'active'
        });

    if (error) return { success: false, message: error.message };

    return { success: true };
}

export async function exitImpersonation() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: false, message: "No autenticado" };

    const isSA = await isSuperAdmin();
    if (!isSA) return { success: false, message: "No autorizado" };

    const supabaseAdmin = createAdminClient();

    // Remove superadmin from clinic
    await supabaseAdmin
        .from("clinic_members")
        .delete()
        .eq("user_id", user.id);

    return { success: true };
}

export async function postAnnouncement(message: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: false, message: "No autenticado" };

    const isSA = await isSuperAdmin();
    if (!isSA) return { success: false, message: "No autorizado" };

    const supabaseAdmin = createAdminClient();

    // First deactivate all previous announcements
    await supabaseAdmin
        .from("system_announcements")
        .update({ is_active: false })
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Dummy condition to update all

    // If message is empty, we just deactivated everything.
    if (!message || message.trim() === "") {
        revalidatePath("/dashboard", "layout");
        return { success: true };
    }

    // Insert new active announcement
    const { error } = await supabaseAdmin
        .from("system_announcements")
        .insert({
            message: message.trim(),
            is_active: true,
            created_by: user.id
        });

    if (error) return { success: false, message: error.message };

    revalidatePath("/dashboard", "layout");
    return { success: true };
}

export async function getActiveAnnouncement() {
    const supabaseAdmin = createAdminClient();
    
    const { data } = await supabaseAdmin
        .from("system_announcements")
        .select("message")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
        
    return data?.message || null;
}

export async function deleteClinicPermanent(clinicId: string) {
    const isSA = await isSuperAdmin();
    if (!isSA) return { success: false, message: "No autorizado" };

    const supabaseAdmin = createAdminClient();

    try {
        // Ejecutamos borrado en cascada manual (bottom-up)
        // Usamos el cliente de admin para saltarnos RLS
        const tables = [
            "payments",
            "invoice_items",
            "invoices",
            "consultation_items",
            "medical_records",
            "vaccinations",
            "pets",
            "clients",
            "inventory_transactions",
            "inventory_audits",
            "inventory_transfers",
            "inventory_movements",
            "purchase_order_items",
            "purchase_orders",
            "inventory_batches",
            "product_kit_items",
            "product_kits",
            "products",
            "suppliers",
            "warehouses",
            "cash_registers",
            "clinic_members"
        ];

        for (const table of tables) {
            await supabaseAdmin.from(table).delete().eq("clinic_id", clinicId);
        }

        // Finalmente, eliminamos la clínica
        const { error } = await supabaseAdmin.from("clinics").delete().eq("id", clinicId);
        
        if (error) throw error;

        revalidatePath("/superadmin/clinics");
        revalidatePath("/dashboard", "layout");
        
        return { success: true };
    } catch (error: any) {
        console.error("Error al borrar clínica:", error);
        return { success: false, message: error.message || "Error eliminando datos en cascada" };
    }
}
