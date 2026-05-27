"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { deductStockFEFO } from "@/actions/inventory";

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

// Obtener todos los kits de la clínica
export async function getProductKits() {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);

    if (!clinicId) return [];

    const { data, error } = await supabase
        .from("product_kits")
        .select(`
            *,
            items:product_kit_items(
                quantity,
                product:products(id, name, unit, category)
            )
        `)
        .eq("clinic_id", clinicId)
        .eq("is_active", true)
        .order("name");

    if (error) {
        console.error("Error al obtener los kits de productos:", error);
        return [];
    }

    return data || [];
}

// Obtener un kit detallado por ID
export async function getProductKitById(id: string) {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);

    if (!clinicId) return null;

    const { data, error } = await supabase
        .from("product_kits")
        .select(`
            *,
            items:product_kit_items(
                product_id,
                quantity,
                product:products(id, name, unit, category)
            )
        `)
        .eq("id", id)
        .eq("clinic_id", clinicId)
        .single();

    if (error || !data) {
        console.error("Error al obtener el detalle del kit:", error);
        return null;
    }

    return data;
}

// Crear un Kit de Productos
export async function createProductKit(data: {
    name: string;
    description?: string;
    salePrice: number;
    items: { productId: string; quantity: number }[];
}) {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);

    if (!clinicId) {
        return { success: false, message: "No autorizado o no asociado a una clínica." };
    }

    if (!data.name?.trim()) {
        return { success: false, message: "El nombre del kit es obligatorio." };
    }

    if (!data.items || data.items.length === 0) {
        return { success: false, message: "El kit debe contener al menos un producto." };
    }

    // 1. Insertar Cabecera del Kit
    const { data: newKit, error: kitError } = await supabase
        .from("product_kits")
        .insert({
            clinic_id: clinicId,
            name: data.name.trim(),
            description: data.description?.trim() || null,
            sale_price: data.salePrice || 0,
            is_active: true
        })
        .select()
        .single();

    if (kitError || !newKit) {
        console.error("Error al crear cabecera del kit:", kitError);
        return { success: false, message: "Error al registrar el kit de productos." };
    }

    // 2. Insertar los Items del Kit
    const kitItems = data.items.map(item => ({
        kit_id: newKit.id,
        product_id: item.productId,
        quantity: item.quantity
    }));

    const { error: itemsError } = await supabase
        .from("product_kit_items")
        .insert(kitItems);

    if (itemsError) {
        console.error("Error al registrar ítems del kit:", itemsError);
        // Intentar deshacer la cabecera
        await supabase.from("product_kits").delete().eq("id", newKit.id);
        return { success: false, message: "Error al registrar los componentes del kit." };
    }

    revalidatePath("/dashboard/inventory/kits");
    return { success: true, message: "Kit creado exitosamente." };
}

// Actualizar un Kit de Productos
export async function updateProductKit(
    id: string,
    data: {
        name: string;
        description?: string;
        salePrice: number;
        items: { productId: string; quantity: number }[];
    }
) {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);

    if (!clinicId) {
        return { success: false, message: "No autorizado." };
    }

    if (!data.name?.trim()) {
        return { success: false, message: "El nombre del kit es obligatorio." };
    }

    if (!data.items || data.items.length === 0) {
        return { success: false, message: "El kit debe contener al menos un producto." };
    }

    // 1. Actualizar Cabecera del Kit
    const { error: kitError } = await supabase
        .from("product_kits")
        .update({
            name: data.name.trim(),
            description: data.description?.trim() || null,
            sale_price: data.salePrice
        })
        .eq("id", id)
        .eq("clinic_id", clinicId);

    if (kitError) {
        console.error("Error al actualizar cabecera del kit:", kitError);
        return { success: false, message: "Error al actualizar el kit de productos." };
    }

    // 2. Reemplazar los Items
    // Eliminamos los anteriores
    const { error: deleteError } = await supabase
        .from("product_kit_items")
        .delete()
        .eq("kit_id", id);

    if (deleteError) {
        console.error("Error al limpiar ítems anteriores del kit:", deleteError);
        return { success: false, message: "Error al actualizar los componentes del kit." };
    }

    // Insertamos los nuevos
    const kitItems = data.items.map(item => ({
        kit_id: id,
        product_id: item.productId,
        quantity: item.quantity
    }));

    const { error: insertError } = await supabase
        .from("product_kit_items")
        .insert(kitItems);

    if (insertError) {
        console.error("Error al reinsertar ítems del kit:", insertError);
        return { success: false, message: "Error al reconfigurar los componentes del kit." };
    }

    revalidatePath("/dashboard/inventory/kits");
    return { success: true, message: "Kit actualizado correctamente." };
}

// Eliminar un Kit de Productos
export async function deleteProductKit(id: string) {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);

    if (!clinicId) {
        return { success: false, message: "No autorizado." };
    }

    // La base de datos tiene ON DELETE CASCADE para product_kit_items referenciando a product_kits,
    // por lo que al eliminar de product_kits se borran automáticamente los items asociados.
    const { error } = await supabase
        .from("product_kits")
        .delete()
        .eq("id", id)
        .eq("clinic_id", clinicId);

    if (error) {
        console.error("Error al eliminar kit de productos:", error);
        return { success: false, message: "Error al eliminar el kit de productos." };
    }

    revalidatePath("/dashboard/inventory/kits");
    return { success: true, message: "Kit eliminado correctamente." };
}

// Consumo directo de Kit (Descuenta stock en almacén seleccionado mediante trigger de base de datos)
export async function useProductKitDirectly(kitId: string, warehouseId: string) {
    const supabase = await createClient();
    const clinicId = await getClinicId(supabase);
    const { data: { user } } = await supabase.auth.getUser();

    if (!clinicId || !user) {
        return { success: false, message: "No autorizado." };
    }

    if (!warehouseId) {
        return { success: false, message: "Debes seleccionar un almacén para el consumo de stock." };
    }

    // 1. Obtener la información completa del kit y sus ítems
    const kit = await getProductKitById(kitId);
    if (!kit) {
        return { success: false, message: "El kit de productos solicitado no fue encontrado." };
    }

    let itemsConsumed = 0;
    const supabaseAdmin = createAdminClient();

    // 2. Procesar el consumo de cada producto del kit
    for (const item of kit.items) {
        // Ignorar servicios
        if (item.product?.category === "Service" || item.product?.category === "Other") {
            continue;
        }

        try {
            // Descontar usando deductStockFEFO
            await deductStockFEFO(
                supabaseAdmin,
                clinicId,
                item.product_id,
                warehouseId,
                Number(item.quantity),
                user.id,
                "consumption",
                `Consumo Directo de Kit: ${kit.name}`
            );
            itemsConsumed++;
        } catch (err: any) {
            console.error(`Error al registrar consumo para producto ${item.product_id}:`, err);
        }
    }

    if (itemsConsumed === 0) {
        return { success: false, message: "No se procesó ningún producto físico del kit." };
    }

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/inventory/kits");
    return { success: true, message: `Se consumieron los productos del kit "${kit.name}" correctamente.` };
}
