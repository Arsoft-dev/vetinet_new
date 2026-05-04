import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
    const supabase = await createAdminClient();
    const { data, error } = await supabase.from("hospital_rounds").select("*");
    return NextResponse.json({ data, error });
}
