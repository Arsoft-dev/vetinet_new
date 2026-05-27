"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Helper para obtener el ID de la clínica del usuario actual
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

// Crear un Almacén
export async function createWarehouse(data: {
    name: string;
    description?: string;
    type: 'storage' | 'point_of_sale' | 'consulting' | 'quarantine';
}) {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);

    if (!clinicId) {
        return { success: false, message: "No autorizado o no asociado a una clínica." };
    }

    if (!data.name?.trim()) {
        return { success: false, message: "El nombre del almacén es obligatorio." };
    }

    const { error } = await supabase
        .from("warehouses")
        .insert({
            clinic_id: clinicId,
            name: data.name.trim(),
            description: data.description?.trim() || null,
            type: data.type || "storage",
            is_active: true
        });

    if (error) {
        console.error("Error al crear almacén:", error);
        return { success: false, message: "Error al registrar el almacén." };
    }

    revalidatePath("/dashboard/inventory/warehouses");
    revalidatePath("/dashboard/inventory");
    return { success: true, message: "Almacén creado exitosamente." };
}

// Actualizar un Almacén
export async function updateWarehouse(
    id: string,
    data: {
        name: string;
        description?: string;
        type: 'storage' | 'point_of_sale' | 'consulting' | 'quarantine';
        is_active: boolean;
    }
) {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);

    if (!clinicId) {
        return { success: false, message: "No autorizado." };
    }

    if (!data.name?.trim()) {
        return { success: false, message: "El nombre del almacén es obligatorio." };
    }

    const { error } = await supabase
        .from("warehouses")
        .update({
            name: data.name.trim(),
            description: data.description?.trim() || null,
            type: data.type,
            is_active: data.is_active
        })
        .eq("id", id)
        .eq("clinic_id", clinicId);

    if (error) {
        console.error("Error al actualizar almacén:", error);
        return { success: false, message: "Error al actualizar el almacén." };
    }

    revalidatePath("/dashboard/inventory/warehouses");
    revalidatePath("/dashboard/inventory");
    return { success: true, message: "Almacén actualizado correctamente." };
}

// Eliminar un Almacén (Borrado físico/seguro)
export async function deleteWarehouse(id: string) {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);

    if (!clinicId) {
        return { success: false, message: "No autorizado." };
    }

    // Validar si existen lotes con stock activo en este almacén antes de eliminar
    const { data: activeStock, error: stockError } = await supabase
        .from("inventory_batches")
        .select("id, quantity")
        .eq("warehouse_id", id)
        .gt("quantity", 0);

    if (stockError) {
        console.error("Error al verificar stock en almacén:", stockError);
        return { success: false, message: "Error al validar la eliminación del almacén." };
    }

    if (activeStock && activeStock.length > 0) {
        return { 
            success: false, 
            message: "No se puede eliminar el almacén porque contiene lotes de productos con stock activo. Transfiere el stock antes de proceder." 
        };
    }

    const { error } = await supabase
        .from("warehouses")
        .delete()
        .eq("id", id)
        .eq("clinic_id", clinicId);

    if (error) {
        console.error("Error al eliminar almacén:", error);
        return { success: false, message: "No se pudo eliminar el almacén (puede tener registros históricos asociados)." };
    }

    revalidatePath("/dashboard/inventory/warehouses");
    revalidatePath("/dashboard/inventory");
    return { success: true, message: "Almacén eliminado correctamente." };
}
