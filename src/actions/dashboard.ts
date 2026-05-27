"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { startOfDay, endOfDay, subDays, format } from "date-fns";
import { es } from "date-fns/locale";

export async function getDashboardStats() {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: memberData } = await supabaseAdmin
        .from("clinic_members")
        .select("clinic_id, users(full_name), clinics(billing_enabled)")
        .eq("user_id", user.id)
        .single();

    if (!memberData) return null;

    const clinicId = memberData.clinic_id;
    const billingEnabled = (memberData.clinics as any)?.billing_enabled ?? true;
    
    // Adjusted for Venezuela Timezone (UTC-4)
    const now = new Date();
    const utcOffset = -4; 
    const vetNow = new Date(now.getTime() + (utcOffset * 3600000));
    
    const todayStart = startOfDay(vetNow).toISOString();
    const todayEnd = endOfDay(vetNow).toISOString();

    // 1. Pacientes Hoy (Medical Records created today)
    const { count: patientsToday } = await supabaseAdmin
        .from("medical_records")
        .select("*", { count: 'exact', head: true })
        .eq("clinic_id", clinicId)
        .gte("visit_date", todayStart)
        .lte("visit_date", todayEnd);

    // 2. Citas Pendientes (Today's scheduled appointments)
    const { count: pendingAppointments } = await supabaseAdmin
        .from("appointments")
        .select("*", { count: 'exact', head: true })
        .eq("clinic_id", clinicId)
        .eq("status", "scheduled")
        .gte("start_time", todayStart)
        .lte("start_time", todayEnd);

    // 3. Hospitalizados (Active hospitalizations)
    const { count: hospitalizedCount } = await supabaseAdmin
        .from("hospitalizations")
        .select("*", { count: 'exact', head: true })
        .eq("clinic_id", clinicId)
        .eq("status", "hospitalized");

    // 4. Ingresos del Día (Solo si está habilitada la facturación)
    let todayIncomeUSD = 0;
    let todayIncomeBS = 0;
    
    if (billingEnabled) {
        const { data: incomeData } = await supabaseAdmin
            .from("invoices")
            .select("total_amount, total_amount_usd")
            .eq("clinic_id", clinicId)
            .neq("status", "voided")
            .gte("created_at", todayStart)
            .lte("created_at", todayEnd);
    
        todayIncomeUSD = incomeData?.reduce((sum, inv) => sum + (Number(inv.total_amount_usd) || 0), 0) || 0;
        todayIncomeBS = incomeData?.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0) || 0;
    }

    // 5. Historial de Actividad (Last 7 days consultations)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), i);
        return {
            start: startOfDay(d).toISOString(),
            end: endOfDay(d).toISOString(),
            label: format(d, 'eee', { locale: es })
        };
    }).reverse();

    const activityData = await Promise.all(last7Days.map(async (day) => {
        const { count } = await supabaseAdmin
            .from("medical_records")
            .select("*", { count: 'exact', head: true })
            .eq("clinic_id", clinicId)
            .gte("visit_date", day.start)
            .lte("visit_date", day.end);
        
        return {
            day: day.label,
            count: count || 0
        };
    }));

    // 6. Próximas Citas (Top upcoming for today)
    const { data: upcoming } = await supabaseAdmin
        .from("appointments")
        .select(`
            id,
            start_time,
            reason,
            pet:pets(name, species)
        `)
        .eq("clinic_id", clinicId)
        .eq("status", "scheduled")
        .gte("start_time", new Date().toISOString())
        .lte("start_time", todayEnd)
        .order("start_time", { ascending: true })
        .limit(5);

    // 7. Ingresos Mensuales y Crecimiento (Solo si está habilitada la facturación)
    let monthlyIncomeUSD = 0;
    let monthlyIncomeBS = 0;
    let incomeGrowth = 0;
    const thirtyDaysAgo = subDays(vetNow, 30).toISOString();

    if (billingEnabled) {
        const { data: monthlyInvoices } = await supabaseAdmin
            .from("invoices")
            .select("total_amount, total_amount_usd, exchange_rate")
            .eq("clinic_id", clinicId)
            .neq("status", "voided")
            .gte("created_at", thirtyDaysAgo);

        monthlyIncomeUSD = monthlyInvoices?.reduce((sum, inv) => sum + (Number(inv.total_amount_usd) || 0), 0) || 0;
        monthlyIncomeBS = monthlyInvoices?.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0) || 0;

        // 7.1 Last Month Income
        const lastMonthStart = subDays(new Date(thirtyDaysAgo), 30).toISOString();
        const lastMonthEnd = thirtyDaysAgo;
        const { data: lastMonthInvoices } = await supabaseAdmin
            .from("invoices")
            .select("total_amount_usd")
            .eq("clinic_id", clinicId)
            .neq("status", "voided")
            .gte("created_at", lastMonthStart)
            .lte("created_at", lastMonthEnd);
        
        const lastMonthIncome = lastMonthInvoices?.reduce((sum, inv) => sum + (Number(inv.total_amount_usd) || 0), 0) || 0;
        incomeGrowth = lastMonthIncome > 0 ? ((monthlyIncomeUSD - lastMonthIncome) / lastMonthIncome) * 100 : 0;
    }

    // 8. Top Items (Solo si está habilitada la facturación)
    let topItems: any[] = [];
    if (billingEnabled) {
        const { data: topItemsData } = await supabaseAdmin
            .from("invoice_items")
            .select(`
                description,
                total_price,
                invoices!inner(clinic_id, created_at, status)
            `)
            .eq("invoices.clinic_id", clinicId)
            .neq("invoices.status", "voided")
            .gte("invoices.created_at", thirtyDaysAgo);
        
        const aggregatedItems = (topItemsData || []).reduce((acc: any, item: any) => {
            if (!acc[item.description]) acc[item.description] = 0;
            acc[item.description] += Number(item.total_price);
            return acc;
        }, {});

        topItems = Object.entries(aggregatedItems)
            .map(([name, value]) => ({ name, value: value as number }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }

    // 9. Distribución de Pagos (Solo si está habilitada la facturación)
    let paymentDistribution: any[] = [];
    if (billingEnabled) {
        const { data: paymentsData } = await supabaseAdmin
            .from("payments")
            .select(`
                method,
                amount_paid_native,
                currency,
                invoices!inner(clinic_id, created_at, status, exchange_rate)
            `)
            .eq("invoices.clinic_id", clinicId)
            .neq("invoices.status", "voided")
            .gte("invoices.created_at", thirtyDaysAgo);
        
        const paymentMethods = (paymentsData || []).reduce((acc: any, p: any) => {
            const methodMap: any = {
                'EFECTIVO_USD': 'Efectivo $',
                'EFECTIVO_BS': 'Efectivo Bs',
                'ZELLE': 'Zelle',
                'PAGO_MOVIL': 'Pago Móvil',
                'TDD': 'Punto de Venta',
                'cash': 'Efectivo',
                'transfer': 'Transferencia',
                'pos': 'Punto de Venta'
            };
            const method = methodMap[p.method] || 'Otro';
            if (!acc[method]) acc[method] = 0;
            
            const rate = Number((p.invoices as any)?.exchange_rate) || 1;
            const amountUsd = p.currency === 'VES' ? (Number(p.amount_paid_native) / rate) : Number(p.amount_paid_native);
            
            acc[method] += amountUsd;
            return acc;
        }, {});

        paymentDistribution = Object.entries(paymentMethods).map(([name, value]) => ({ name, value: value as number }));
    }

    // 10. Total Pacientes
    const { count: totalPatients } = await supabaseAdmin
        .from("pets")
        .select("*", { count: 'exact', head: true })
        .eq("clinic_id", clinicId);

    // Fetch Clinic Name
    const { data: clinicData } = await supabaseAdmin
        .from("clinics")
        .select("name")
        .eq("id", clinicId)
        .single();

    return {
        vetName: (memberData.users as any)?.full_name || "Doctor",
        clinicName: clinicData?.name || "Clínica",
        billingEnabled,
        stats: {
            patientsToday: patientsToday || 0,
            pendingAppointments: pendingAppointments || 0,
            hospitalized: hospitalizedCount || 0,
            totalIncome: todayIncomeUSD,
            monthlyIncome: monthlyIncomeUSD,
            monthlyIncomeBS: monthlyIncomeBS,
            incomeGrowth: incomeGrowth,
            totalPatients: totalPatients || 0
        },
        activityData,
        topItems,
        paymentDistribution,
        peakHours: (await supabaseAdmin
            .from("medical_records")
            .select("visit_date")
            .eq("clinic_id", clinicId)
            .gte("visit_date", thirtyDaysAgo)
        ).data?.reduce((acc: any, rec: any) => {
            const hour = new Date(rec.visit_date).getHours();
            if (!acc[hour]) acc[hour] = 0;
            acc[hour]++;
            return acc;
        }, {}) || {},
        upcoming: upcoming || []
    };
}
