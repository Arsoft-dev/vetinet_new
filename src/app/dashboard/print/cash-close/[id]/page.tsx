import { createAdminClient } from "@/lib/supabase/admin";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PrintTrigger } from "@/components/dashboard/print/PrintTrigger";

export default async function CashCloseTicket({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createAdminClient();

    // 1. Fetch Register
    const { data: register, error } = await supabase
        .from("cash_registers")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !register) {
        console.error("Error fetching register:", error);
        return <div className="p-10 font-bold text-red-500 text-center">Caja no encontrada: {error?.message}</div>;
    }

    // 1.5 Fetch user email manually
    const { data: { user: openedByUser } } = await supabase.auth.admin.getUserById(register.opened_by);

    // 2. Fetch Payments
    const { data: payments } = await supabase
        .from("payments")
        .select("*")
        .eq("cash_register_id", id);

    // 3. Aggregate
    const totals = {
        EFECTIVO_USD: 0,
        ZELLE: 0,
        EFECTIVO_BS: 0,
        PAGO_MOVIL: 0,
        TDD: 0
    };

    (payments || []).forEach(p => {
        const method = p.method as keyof typeof totals;
        const amount = Number(p.amount_paid_native);
        if (method in totals) {
            totals[method] += amount;
        }
    });

    // 4. Calculate Expected
    const expectedUSD = Number(register.initial_balance_usd) + totals.EFECTIVO_USD;
    const expectedVES = Number(register.initial_balance_ves) + totals.EFECTIVO_BS;

    // 5. Calculate Differences
    const diffUSD = Number(register.counted_usd) - expectedUSD;
    const diffVES = Number(register.counted_ves) - expectedVES;

    return (
        <div className="bg-white text-black font-mono text-sm p-4 w-[80mm] mx-auto leading-tight print:p-0 print:w-full">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { margin: 0; size: 80mm auto; }
                    body { margin: 0; padding: 10px; width: 80mm; }
                    .no-print { display: none; }
                }
            `}} />

            <div className="text-center space-y-1 mb-6">
                <h1 className="font-bold text-xl uppercase">CIERRE DE CAJA (Z)</h1>
                <p>Clínica Veterinaria</p>
                <p>ID Turno: {register.id.split('-')[0]}</p>
                <div className="border-t border-dashed border-black my-2"></div>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                    <span>Apertura:</span>
                    <span>{format(new Date(register.opened_at), "dd/MM/yyyy HH:mm")}</span>
                </div>
                <div className="flex justify-between">
                    <span>Cierre:</span>
                    <span>{register.closed_at ? format(new Date(register.closed_at), "dd/MM/yyyy HH:mm") : 'En Curso'}</span>
                </div>
                <div className="flex justify-between">
                    <span>Cajero:</span>
                    <span className="truncate max-w-[120px]">{openedByUser?.email || 'N/A'}</span>
                </div>
            </div>

            <div className="border-t border-dashed border-black my-3"></div>
            
            <h2 className="font-bold uppercase text-center mb-2">Fondo de Caja</h2>
            <div className="flex justify-between">
                <span>Efectivo USD:</span>
                <span>${Number(register.initial_balance_usd).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
                <span>Efectivo Bs:</span>
                <span>Bs {Number(register.initial_balance_ves).toFixed(2)}</span>
            </div>

            <div className="border-t border-dashed border-black my-3"></div>

            <h2 className="font-bold uppercase text-center mb-2">Ventas por Método</h2>
            <div className="flex justify-between">
                <span>Efectivo USD:</span>
                <span>${totals.EFECTIVO_USD.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
                <span>Zelle:</span>
                <span>${totals.ZELLE.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
                <span>Efectivo Bs:</span>
                <span>Bs {totals.EFECTIVO_BS.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
                <span>Pago Móvil:</span>
                <span>Bs {totals.PAGO_MOVIL.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
                <span>Punto de Venta:</span>
                <span>Bs {totals.TDD.toFixed(2)}</span>
            </div>

            <div className="border-t border-dashed border-black my-3"></div>

            <h2 className="font-bold uppercase text-center mb-2">Auditoría Física</h2>
            
            <div className="mb-4">
                <p className="font-bold underline mb-1">DÓLARES ($)</p>
                <div className="flex justify-between">
                    <span>Sistema Esperaba:</span>
                    <span>${expectedUSD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Cajero Contó:</span>
                    <span>${Number(register.counted_usd).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold mt-1">
                    <span>Diferencia:</span>
                    <span className={diffUSD < 0 ? 'text-black' : ''}>
                        {diffUSD > 0 ? '+' : ''}${diffUSD.toFixed(2)}
                    </span>
                </div>
            </div>

            <div>
                <p className="font-bold underline mb-1">BOLÍVARES (Bs)</p>
                <div className="flex justify-between">
                    <span>Sistema Esperaba:</span>
                    <span>Bs {expectedVES.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Cajero Contó:</span>
                    <span>Bs {Number(register.counted_ves).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold mt-1">
                    <span>Diferencia:</span>
                    <span className={diffVES < 0 ? 'text-black' : ''}>
                        {diffVES > 0 ? '+' : ''}Bs {diffVES.toFixed(2)}
                    </span>
                </div>
            </div>

            <div className="border-t border-dashed border-black my-4"></div>
            
            <div className="text-center mt-10">
                <div className="border-t border-black w-3/4 mx-auto mb-1"></div>
                <p className="text-xs">Firma del Cajero</p>
            </div>

            <div className="text-center mt-6">
                <p className="text-xs">Este documento es un reporte interno de auditoría y no tiene validez fiscal.</p>
            </div>

            <div className="mt-8 no-print">
                <PrintTrigger />
            </div>
        </div>
    );
}
