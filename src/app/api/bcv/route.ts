import { NextResponse } from 'next/server';

// Revalidate this path every hour so Next.js caches the BCV response on the server natively!
export const revalidate = 3600; 

export async function GET() {
    try {
        // PyDolarVenezuela is a robust open source scraper API for VEN exchange rates
        const res = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar/page?page=bcv', {
            next: { revalidate: 3600 } 
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch from PyDolar: ${res.status}`);
        }

        const data = await res.json();
        
        // pydolar structure returns the monitors inside "monitors"
        let usdRate = 0;
        let eurRate = 0;

        if (data && data.monitors) {
            const usdMonitor = Object.values(data.monitors).find((m: any) => m.title?.toLowerCase().includes('dólar') || m.title === 'USD');
            const eurMonitor = Object.values(data.monitors).find((m: any) => m.title?.toLowerCase().includes('euro') || m.title === 'EUR');

            usdRate = usdMonitor ? parseFloat((usdMonitor as any).price) : 0;
            eurRate = eurMonitor ? parseFloat((eurMonitor as any).price) : 0;
        }

        return NextResponse.json({
            usd: usdRate,
            eur: eurRate,
            success: true,
            provider: 'PyDolarVenezuela (BCV)',
            last_update: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("BCV Fetch Error:", error);
        
        // Fallback or just return error indicating clients should fall back to last known DB records
        return NextResponse.json({
            success: false,
            message: "All BCV resolvers failed.",
            error: error.message
        }, { status: 500 });
    }
}
