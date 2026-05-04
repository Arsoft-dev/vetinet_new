"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const SOURCES: Record<string, string[]> = {
    USD: ["https://ve.dolarapi.com/v1/dolares/oficial", "https://dolarapi.com/v1/dolares/oficial"],
    EUR: ["https://ve.dolarapi.com/v1/euros/oficial", "https://dolarapi.com/v1/euros/oficial"]
};

async function fetchWithFallback(currency: 'USD' | 'EUR' = 'USD') {
    // 1. Try Primary: PyDolarVenezuela (Most Reliable scraper)
    try {
        console.log(`Intentando sincronizar tasa primaria desde PyDolar: BCV`);
        const pydolar = await fetch("https://pydolarvenezuela-api.vercel.app/api/v1/dollar/page?page=bcv", { cache: 'no-store', signal: AbortSignal.timeout(8000) });
        if (pydolar.ok) {
            const data = await pydolar.json();
            if (data && data.monitors) {
                const monitor = Object.values(data.monitors).find((m: any) => 
                    currency === 'USD' ? (m.title?.toLowerCase().includes('dólar') || m.title === 'USD') 
                                       : (m.title?.toLowerCase().includes('euro') || m.title === 'EUR')
                );
                
                const rate = monitor ? parseFloat((monitor as any).price) : 0;
                if (rate > 10) return { rate, source: "PyDolar (BCV)", raw: data };
            }
        }
    } catch (e) {
        console.warn(`Fallo primario PyDolar:`, e);
    }

    // 2. Try Fallbacks
    const urls = SOURCES[currency] || SOURCES.USD;
    for (const url of urls) {
        try {
            console.log(`Intentando sincronizar tasa fallback desde: ${url}`);
            const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
            if (!response.ok) continue;
            
            const data = await response.json();
            const rate = data.promedio || data.monto || data.valor || data.price;
            
            if (rate && rate > 10) return { rate, source: url, raw: data };
        } catch (e) {
            console.warn(`Fallo en fuente ${url}:`, e);
            continue;
        }
    }
    return null;
}

export async function syncExchangeRate() {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // 1. Get user's clinic and settings
    const { data: member } = await supabaseAdmin
        .from("clinic_members")
        .select("clinic_id, clinics(settings)")
        .eq("user_id", user.id)
        .single();

    if (!member) return null;
    const clinicId = member.clinic_id;
    const settings = (member.clinics as any)?.settings || {};

    const preferredCurrency = settings.preferred_currency || 'USD';

    // 2. Skip auto-sync if mode is manual
    if (settings.exchange_rate_mode === 'manual') {
        return settings.manual_rate || (preferredCurrency === 'EUR' ? 60.50 : 54.50);
    }

    // 3. Check if we need to sync (limit to 1 hour)
    const { data: recent } = await supabaseAdmin
        .from("exchange_rates")
        .select("created_at")
        .eq("clinic_id", clinicId)
        .eq("currency_code", preferredCurrency)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (recent && (new Date().getTime() - new Date(recent.created_at).getTime() < 3600000)) {
        return null; // Skip if synchronized less than 1 hour ago
    }

    try {
        // 4. Fetch from External APIs (High Availability)
        const result = await fetchWithFallback(preferredCurrency as any);
        
        if (!result) {
            console.warn(`Todas las fuentes de tasa ${preferredCurrency} fallaron. Usando última tasa conocida.`);
            return await getLatestRate();
        }

        const currentRate = result.rate;

        // 5. Get Last saved rate for THIS clinic to compare
        const { data: lastRateEntry } = await supabaseAdmin
            .from("exchange_rates")
            .select("rate")
            .eq("clinic_id", clinicId)
            .eq("currency_code", preferredCurrency)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        const lastRate = lastRateEntry?.rate || 0;

        // 6. Save new rate if it's different
        if (Math.abs(currentRate - lastRate) > 0.001) {
            console.log(`Guardando nueva tasa BCV: ${currentRate} Bs`);
            const { error: insertError } = await supabaseAdmin
                .from("exchange_rates")
                .insert({
                    clinic_id: clinicId,
                    currency_code: preferredCurrency,
                    rate: currentRate,
                    provider: "BCV",
                    metadata: { source: result.source, raw: result.raw }
                });

            if (insertError) {
                console.error("CRITICAL ERROR inserting exchange rate:", insertError);
            }

            // 7. Create Notification if change is significant (> 0.5%)
            if (lastRate > 0 && Math.abs((currentRate - lastRate) / lastRate) > 0.005) {
                const diff = currentRate - lastRate;
                const icon = diff > 0 ? "📈" : "📉";
                
                await supabaseAdmin
                    .from("notifications")
                    .insert({
                        clinic_id: clinicId,
                        user_id: user.id,
                        title: `${icon} Cambio en Tasa BCV (${preferredCurrency})`,
                        message: `La tasa oficial del BCV ha ${diff > 0 ? 'subido' : 'bajado'} a ${currentRate} Bs.`,
                        type: "bcv_change",
                        metadata: { old_rate: lastRate, new_rate: currentRate, currency: preferredCurrency }
                    });
            }
        }

        return currentRate;
    } catch (error) {
        console.error("Error crítico en sincronización:", error);
        return await getLatestRate();
    }
}

export async function getLatestRate() {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    // 1. Get Clinic Settings
    const { data: member } = await supabaseAdmin
        .from("clinic_members")
        .select("clinic_id, clinics(settings)")
        .eq("user_id", user.id)
        .single();

    if (!member) return 0;
    const settings = (member.clinics as any)?.settings || {};
    const preferredCurrency = settings.preferred_currency || 'USD';

    // 2. Return manual rate if configured
    if (settings.exchange_rate_mode === 'manual') {
        return Number(settings.manual_rate) || (preferredCurrency === 'EUR' ? 60.50 : 54.50);
    }

    // 3. Else, get the latest official rate for this clinic
    const { data: rate } = await supabaseAdmin
        .from("exchange_rates")
        .select("rate")
        .eq("clinic_id", member.clinic_id)
        .eq("currency_code", preferredCurrency)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    return rate?.rate || (preferredCurrency === 'EUR' ? 60.50 : 54.50);
}

export async function getRateContext() {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: member } = await supabaseAdmin
        .from("clinic_members")
        .select("clinic_id, clinics(settings)")
        .eq("user_id", user.id)
        .single();

    if (!member) return null;
    const settings = (member.clinics as any)?.settings || {};
    const preferredCurrency = settings.preferred_currency || 'USD';
    const isManual = settings.exchange_rate_mode === 'manual';
    
    // Get official Rate
    const { data: rateObj, error: rateError } = await supabaseAdmin
        .from("exchange_rates")
        .select("rate")
        .eq("clinic_id", member.clinic_id)
        .eq("currency_code", preferredCurrency)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (rateError) {
        console.error("Error reading exchange_rates:", rateError);
    }

    const officialRate = rateObj?.rate || (preferredCurrency === 'EUR' ? 60.50 : 54.50);
    const activeRate = isManual ? (Number(settings.manual_rate) || officialRate) : officialRate;

    return {
        activeRate,
        officialRate,
        isManual,
        preferredCurrency,
        isBelowOfficial: isManual && activeRate < officialRate
    };
}
