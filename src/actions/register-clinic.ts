"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

interface RegisterState {
    success: boolean;
    message: string;
}

export async function registerClinic(prevState: any, formData: FormData): Promise<RegisterState> {
    const supabase = createAdminClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const clinicName = formData.get("clinicName") as string;
    const fullName = formData.get("fullName") as string; // Optional during sign up, but good to have

    try {
        // 1. Create Supabase Auth User
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm for MVP friction reduction
            // user_metadata: { full_name: fullName } // Can store here too
        });

        if (authError) throw new Error(`Error creating user: ${authError.message}`);
        const userId = authData.user.id;

        // 2. Create Clinic (Tenant)
        const { data: clinicData, error: clinicError } = await supabase
            .from("clinics")
            .insert({
                name: clinicName,
                // slug: ... generate slug based on name? optional for now
            })
            .select()
            .single();

        if (clinicError) throw new Error(`Error creating clinic: ${clinicError.message}`);
        const clinicId = clinicData.id;

        // 3. Create User Profile (public.users)
        const { error: profileError } = await supabase
            .from("users")
            .insert({
                id: userId,
                email: email,
                full_name: fullName || email.split("@")[0], // Fallback name
            });

        if (profileError) throw new Error(`Error saving profile: ${profileError.message}`);

        // 4. Link Member (Admin Role)
        const { error: memberError } = await supabase
            .from("clinic_members")
            .insert({
                clinic_id: clinicId,
                user_id: userId,
                role: "admin",
                is_active: true
            });

        if (memberError) throw new Error(`Error linking member: ${memberError.message}`);

        return {
            success: true,
            message: "Cuenta creada exitosamente. Ya puedes iniciar sesión."
        };

    } catch (error: any) {
        console.error("Clinic Registration Error:", error);
        return {
            success: false,
            message: error.message || "Error al registrar la clínica."
        };
    }
}
