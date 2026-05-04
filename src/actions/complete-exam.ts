"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function completeExamOrder(
    examId: string,
    fileUrl: string,
    petId: string, // Needed for revalidation path
    findings?: string
) {
    const supabaseAdmin = createAdminClient();
    const supabase = await createClient();

    // 1. Verify User (Basic Security)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    // 2. Update Exam Order
    const { error } = await supabaseAdmin
        .from("exam_orders")
        .update({
            status: "completed",
            results_url: fileUrl,
            findings: findings || null,
            updated_at: new Date().toISOString()
        })
        .eq("id", examId);

    if (error) throw new Error(`Error actualizando orden: ${error.message}`);

    // 3. Revalidate UI
    revalidatePath(`/dashboard/patients/${petId}`);
    return { success: true };
}
