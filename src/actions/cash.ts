"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getCurrentCashRegister() {
    const supabase = await createClient();
    
    // Get user's clinic
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: member } = await supabase
        .from("clinic_members")
        .select("clinic_id")
        .eq("user_id", user.id)
        .single();
        
    if (!member) return null;

    // Get the most recent OPEN cash register
    const { data: register, error } = await supabase
        .from("cash_registers")
        .select("*")
        .eq("clinic_id", member.clinic_id)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error || !register) return null;

    return register;
}

export async function openCashRegister(initialUSD: number, initialVES: number) {
    const supabaseAdmin = await createAdminClient();
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: member } = await supabase
        .from("clinic_members")
        .select("clinic_id")
        .eq("user_id", user.id)
        .single();
        
    if (!member) return { success: false, message: "Clinic not found" };

    // Check if there is already an open register
    const current = await getCurrentCashRegister();
    if (current) {
        return { success: false, message: "Ya existe una caja abierta. Ciérrala primero." };
    }

    const { data, error } = await supabaseAdmin
        .from("cash_registers")
        .insert({
            clinic_id: member.clinic_id,
            opened_by: user.id,
            initial_balance_usd: initialUSD,
            initial_balance_ves: initialVES,
            status: "open"
        })
        .select()
        .single();

    if (error) {
        console.error("Error opening cash register:", error);
        return { success: false, message: "Error al abrir la caja." };
    }

    revalidatePath("/dashboard/billing");
    revalidatePath("/dashboard/billing/pos");
    return { success: true, register: data };
}

export async function getCashRegisterTotals(registerId: string) {
    const supabaseAdmin = await createAdminClient();
    
    // Fetch all payments for this register
    const { data: payments, error } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("cash_register_id", registerId);

    if (error) {
        console.error("Error fetching payments for register:", error);
        return null;
    }

    // Aggregate totals
    const totals = {
        EFECTIVO_USD: 0,
        ZELLE: 0,
        EFECTIVO_BS: 0,
        PAGO_MOVIL: 0,
        TDD: 0,
        TOTAL_USD: 0,
        TOTAL_VES: 0
    };

    payments.forEach(p => {
        // We sum the native amount based on the method
        const method = p.method as keyof typeof totals;
        const amount = Number(p.amount_paid_native);
        
        if (method === 'EFECTIVO_USD' || method === 'ZELLE') {
            totals[method] += amount;
            totals.TOTAL_USD += amount;
        } else {
            if (method in totals) totals[method] += amount;
            totals.TOTAL_VES += amount;
        }
    });

    return totals;
}

export async function closeCashRegister(registerId: string, countedUSD: number, countedVES: number) {
    const supabaseAdmin = await createAdminClient();
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { error } = await supabaseAdmin
        .from("cash_registers")
        .update({
            status: "closed",
            closed_at: new Date().toISOString(),
            closed_by: user.id,
            counted_usd: countedUSD,
            counted_ves: countedVES
        })
        .eq("id", registerId);

    if (error) {
        console.error("Error closing cash register:", error);
        return { success: false, message: "Error al cerrar la caja." };
    }

    revalidatePath("/dashboard/billing");
    revalidatePath("/dashboard/billing/pos");
    return { success: true };
}

export async function getClosedCashRegisters(limit: number = 10, dateFilter?: string) {
    const supabaseAdmin = await createAdminClient();
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: member } = await supabase
        .from("clinic_members")
        .select("clinic_id")
        .eq("user_id", user.id)
        .single();
        
    if (!member) return [];

    let query = supabaseAdmin
        .from("cash_registers")
        .select("*")
        .eq("clinic_id", member.clinic_id)
        .eq("status", "closed")
        .order("closed_at", { ascending: false });

    if (dateFilter) {
        // Append local timezone offset (UTC-4 for Venezuela) to avoid JS UTC parsing shifts
        const startIso = `${dateFilter}T00:00:00-04:00`;
        const endIso = `${dateFilter}T23:59:59-04:00`;
        
        query = query.gte("closed_at", startIso).lte("closed_at", endIso);
    } else {
        query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching closed cash registers:", error);
        return [];
    }

    return data;
}
