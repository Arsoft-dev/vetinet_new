"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Acción para obtener la clínica asociada al usuario autenticado
async function getClinicId(supabase: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: member } = await supabase
        .from("clinic_members")
        .select("clinic_id")
        .eq("user_id", user.id)
        .single();

    return member ? member.clinic_id : null;
}

// Crear un nuevo proveedor
export async function createSupplier(formData: {
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    tax_id?: string;
    address?: string;
}) {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);

    if (!clinicId) {
        return { success: false, message: "No autorizado o no asociado a una clínica." };
    }

    if (!formData.name.trim()) {
        return { success: false, message: "El nombre del proveedor es obligatorio." };
    }

    const { error } = await supabase
        .from("suppliers")
        .insert({
            clinic_id: clinicId,
            name: formData.name.trim(),
            contact_person: formData.contact_person?.trim() || null,
            phone: formData.phone?.trim() || null,
            email: formData.email?.trim() || null,
            tax_id: formData.tax_id?.trim() || null,
            address: formData.address?.trim() || null,
        });

    if (error) {
        console.error("Error al crear proveedor:", error);
        return { success: false, message: "Error al guardar el proveedor en la base de datos." };
    }

    revalidatePath("/dashboard/inventory/suppliers");
    return { success: true, message: "Proveedor creado exitosamente." };
}

// Actualizar un proveedor existente
export async function updateSupplier(id: string, formData: {
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    tax_id?: string;
    address?: string;
}) {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);

    if (!clinicId) {
        return { success: false, message: "No autorizado." };
    }

    if (!formData.name.trim()) {
        return { success: false, message: "El nombre del proveedor es obligatorio." };
    }

    const { error } = await supabase
        .from("suppliers")
        .update({
            name: formData.name.trim(),
            contact_person: formData.contact_person?.trim() || null,
            phone: formData.phone?.trim() || null,
            email: formData.email?.trim() || null,
            tax_id: formData.tax_id?.trim() || null,
            address: formData.address?.trim() || null,
        })
        .eq("id", id)
        .eq("clinic_id", clinicId);

    if (error) {
        console.error("Error al actualizar proveedor:", error);
        return { success: false, message: "Error al actualizar los datos del proveedor." };
    }

    revalidatePath("/dashboard/inventory/suppliers");
    return { success: true, message: "Proveedor actualizado correctamente." };
}

// Eliminar un proveedor (Físico por ahora, o lógico si tuviera is_active)
export async function deleteSupplier(id: string) {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);

    if (!clinicId) {
        return { success: false, message: "No autorizado." };
    }

    const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", id)
        .eq("clinic_id", clinicId);

    if (error) {
        console.error("Error al eliminar proveedor:", error);
        return { success: false, message: "Error al eliminar el proveedor (puede que tenga órdenes de compra asociadas)." };
    }

    revalidatePath("/dashboard/inventory/suppliers");
    return { success: true, message: "Proveedor eliminado exitosamente." };
}
