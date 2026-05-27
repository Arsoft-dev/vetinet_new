"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getInventoryStats(warehouseId?: string) {
    const supabase = await createClient();

    // 1. Get user's clinic config
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { totalProducts: 0, lowStock: 0, totalValue: 0 };
    
    const { data: member } = await supabase
        .from("clinic_members")
        .select("clinic_id, clinics(billing_enabled)")
        .eq("user_id", user.id)
        .single();
    
    if (!member) return { totalProducts: 0, lowStock: 0, totalValue: 0 };
    const billingEnabled = (member.clinics as any)?.billing_enabled ?? true;

    // Get total products count
    const { count: totalProducts } = await supabase
        .from("products")
        .select("*", { count: 'exact', head: true })
        .eq("clinic_id", member.clinic_id)
        .eq("is_archived", false);

    const { data: products, error: dataError } = await supabase
        .from("products")
        .select(`
            id,
            category,
            min_stock_level
            ${billingEnabled ? ', sale_price' : ''}
        `)
        .eq("clinic_id", member.clinic_id)
        .eq("is_archived", false);

    if (dataError) {
        console.error("Error fetching inventory stats:", dataError);
        return { totalProducts: 0, lowStock: 0, totalValue: 0 };
    }

    // Since we need actual stock from batches to know if it's low,
    // we need to sum up batches for each product. 
    // This might be heavy. Let's create a SQL function or just fetch batches too.

    let batchesQuery = supabase
        .from("inventory_batches")
        .select("product_id, quantity, expiry_date, warehouse_id");

    if (warehouseId) {
        batchesQuery = batchesQuery.eq("warehouse_id", warehouseId);
    }

    const { data: batches } = await batchesQuery;

    if (!batches) return { totalProducts: totalProducts || 0, lowStock: 0, totalValue: 0 };

    let lowStockCount = 0;
    let totalValue = 0;

    // Map Stock by Product
    const stockMap = new Map<string, number>();
    batches.forEach(b => {
        const current = stockMap.get(b.product_id) || 0;
        stockMap.set(b.product_id, current + Number(b.quantity));
    });

    products.forEach(p => {
        const isService = (p as any).category === 'Service' || (p as any).category === 'Other';
        const stock = stockMap.get(p.id) || 0;
        
        if (!isService && stock <= (p.min_stock_level || 5)) {
            lowStockCount++;
        }
        
        if (billingEnabled) {
            totalValue += (Number((p as any).sale_price) * stock);
        }
    });

    return {
        totalProducts: totalProducts || 0,
        lowStock: lowStockCount,
        totalValue: totalValue
    };
}

export async function getProducts(query: string = "", warehouseId?: string) {
    const supabase = await createClient();

    // 1. Get billing config
    const { data: { user } } = await supabase.auth.getUser();
    const { data: member } = await supabase
        .from("clinic_members")
        .select("clinic_id, clinics(billing_enabled)")
        .eq("user_id", user?.id)
        .single();
    const billingEnabled = (member?.clinics as any)?.billing_enabled ?? true;

    // Fetch Products with their Batches to calculate total stock
    let dbQuery = supabase
        .from("products")
        .select(`
            id, name, category, unit, min_stock_level, is_archived, created_at, barcode
            ${billingEnabled ? ', sale_price' : ''},
            batches:inventory_batches(
                quantity,
                expiry_date,
                warehouse_id
            )
        `)
        .eq("clinic_id", member.clinic_id)
        .eq("is_archived", false)
        .order("name");

    if (query) {
        dbQuery = dbQuery.ilike("name", `%${query}%`);
    }

    const { data, error } = await dbQuery;

    if (error) {
        console.error("Error fetching products:", error.message || error);
        return [];
    }

    // Process data to add 'totalStock' field
    const processed = data.map(product => {
        // Filtrar lotes por almacén si se proporciona warehouseId
        const filteredBatches = warehouseId
            ? product.batches?.filter((b: any) => b.warehouse_id === warehouseId) || []
            : product.batches || [];

        const isService = product.category === 'Service' || product.category === 'Other';
        const totalStock = isService ? null : (filteredBatches.reduce((acc: number, b: any) => acc + Number(b.quantity), 0) || 0);
        
        let hasExpiring = false;
        let isExpired = false;
        let closestExpiry = null;

        if (!isService) {
            const validBatches = filteredBatches.filter((b: any) => Number(b.quantity) > 0 && b.expiry_date) || [];

            if (validBatches.length > 0) {
                const earliestBatch = validBatches.reduce((min: any, b: any) => {
                    return new Date(b.expiry_date) < new Date(min.expiry_date) ? b : min;
                });

                closestExpiry = earliestBatch.expiry_date;
                
                const date = new Date(closestExpiry);
                const now = new Date();
                const daysDiff = (date.getTime() - now.getTime()) / (1000 * 3600 * 24);

                if (daysDiff < 0) {
                    isExpired = true;
                } else if (daysDiff <= 15) {
                    hasExpiring = true;
                }
            }
        }

        return {
            ...product,
            totalStock,
            hasExpiring,
            isExpired,
            closestExpiry
        };
    });

    return processed;
}

export async function createProduct(formData: FormData) {
    const supabase = await createClient();

    // Get current clinic
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "No autorizado" };

    const { data: member } = await supabase
        .from("clinic_members")
        .select("clinic_id")
        .eq("user_id", user.id)
        .single();

    if (!member) return { success: false, message: "No asociado a una clínica" };

    const rawData = {
        name: formData.get("name") as string,
        category: formData.get("category") as string,
        min_stock_level: parseInt(formData.get("minStock") as string) || 5,
        sale_price: parseFloat(formData.get("price") as string) || 0,
        unit: formData.get("unit") as string || 'unit',
        barcode: formData.get("barcode") as string || null,
        clinic_id: member.clinic_id
    };

    const { data: newProduct, error } = await supabase
        .from("products")
        .insert(rawData)
        .select()
        .single();

    if (error) {
        console.error("Create product error:", error);
        return { success: false, message: "Error al crear producto" };
    }

    // Initialize Audit Trail so it appears in History immediately
    await supabase.from("inventory_transactions").insert({
        clinic_id: member.clinic_id,
        product_id: newProduct.id,
        transaction_type: 'adjustment',
        quantity: 0,
        notes: 'Registro Inicial en Catálogo',
        created_by: user.id
    });

    return { success: true, message: "Producto creado exitosamente" };
}

export async function receiveStock(formData: FormData) {
    const supabase = await createClient();

    // Get Clean User & Clinic
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "No autorizado" };

    const { data: member } = await supabase
        .from("clinic_members")
        .select("clinic_id")
        .eq("user_id", user.id)
        .single();

    if (!member) return { success: false, message: "No asociado a una clínica" };

    const productId = formData.get("productId") as string;
    const quantity = parseFloat(formData.get("quantity") as string);
    const batchNumber = formData.get("batchNumber") as string || "GENERIC-" + new Date().toISOString().slice(0, 10);
    const expiryDate = formData.get("expiryDate") as string;

    if (!productId || quantity <= 0) {
        return { success: false, message: "Datos inválidos" };
    }

    // 1. Get a default warehouse (For MVP we use the first one found or create one)
    let { data: warehouse } = await supabase
        .from("warehouses")
        .select("id")
        .eq("clinic_id", member.clinic_id)
        .limit(1)
        .single();

    if (!warehouse) {
        // Auto-create Main Warehouse if none exists
        const { data: newWarehouse, error: whError } = await supabase
            .from("warehouses")
            .insert({
                clinic_id: member.clinic_id,
                name: "Almacén Principal",
                description: "Bodega general automática"
            })
            .select()
            .single();

        if (whError || !newWarehouse) return { success: false, message: "Error asignando almacén" };
        warehouse = newWarehouse;
    }

    // 2. Create Batch
    const { data: batch, error: batchError } = await supabase
        .from("inventory_batches")
        .insert({
            product_id: productId,
            warehouse_id: warehouse!.id,
            batch_number: batchNumber,
            expiry_date: expiryDate || null,
            quantity: quantity
        })
        .select()
        .single();

    if (batchError) {
        console.error("Batch error:", batchError);
        return { success: false, message: "Error al registrar lote" };
    }

    // 3. Log Transaction (PURCHASE)
    const { error: moveError } = await supabase
        .from("inventory_transactions")
        .insert({
            clinic_id: member.clinic_id,
            product_id: productId,
            batch_id: batch.id,
            created_by: user.id,
            transaction_type: 'purchase',
            quantity: quantity,
            notes: 'Ingreso Manual: ' + (formData.get("reason") || 'Compra / Ingreso Inicial')
        });

    if (moveError) console.error("Movement log error:", moveError); // Non-blocking

    return { success: true, message: `Ingresaron ${quantity} unidades correctamente` };
}

export async function updateProduct(formData: FormData) {
    const supabase = await createClient();
    const productId = formData.get("id") as string;

    if (!productId) return { success: false, message: "ID de producto requerido" };

    const rawData = {
        name: formData.get("name") as string,
        category: formData.get("category") as string,
        min_stock_level: parseInt(formData.get("minStock") as string) || 5,
        sale_price: parseFloat(formData.get("price") as string) || 0,
        unit: formData.get("unit") as string || 'unit',
        barcode: formData.get("barcode") as string || null
    };

    const { error } = await supabase
        .from("products")
        .update(rawData)
        .eq("id", productId);

    if (error) {
        console.error("Update product error:", error);
        return { success: false, message: "Error al actualizar producto" };
    }

    return { success: true, message: "Producto actualizado correctamente" };
}

export async function deleteProduct(productId: string) {
    const supabase = await createClient();

    // Soft Delete (Archive)
    const { error } = await supabase
        .from("products")
        .update({ is_archived: true })
        .eq("id", productId);

    if (error) {
        console.error("Delete product error:", error);
        return { success: false, message: "Error al eliminar producto" };
    }

    return { success: true, message: "Producto archivado correctamente" };
}

export async function consumeProduct(formData: FormData) {
    const supabase = await createClient();

    const productId = formData.get("productId") as string;
    const consultationId = formData.get("consultationId") as string;
    const quantity = parseFloat(formData.get("quantity") as string);

    if (!productId || !consultationId || quantity <= 0) {
        return { success: false, message: "Datos inválidos" };
    }

    // 1. Get User/Clinic
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "No autorizado" };

    const { data: member } = await supabase
        .from("clinic_members")
        .select("clinic_id")
        .eq("user_id", user.id)
        .single();

    if (!member) return { success: false, message: "No asociado a una clínica" };

    // 2. Get Product Info (Price, Type)
    const { data: product } = await supabase
        .from("products")
        .select("id, name, sale_price, category, is_archived")
        .eq("id", productId)
        .single();

    if (!product || product.is_archived) return { success: false, message: "Producto no encontrado o archivado" };

    // 3. Handle Service (No Stock) vs Physical Product
    if (product.category === 'Service' || product.category === 'Other') {
        const { error } = await supabase.from("consultation_items").insert({
            clinic_id: member.clinic_id,
            medical_record_id: consultationId,
            product_id: productId,
            quantity: quantity,
            unit_price: product.sale_price,
            total_price: Number(product.sale_price) * quantity
        });

        if (error) return { success: false, message: "Error registrando servicio" };
        return { success: true, message: "Servicio agregado a la consulta" };
    }

    // 4. Physical Product: Log Transaction (SALE)
    // We let the Database Trigger handle FIFO batch deduction automatically
    const { error: moveError } = await supabase
        .from("inventory_transactions")
        .insert({
            clinic_id: member.clinic_id,
            product_id: productId,
            created_by: user.id,
            transaction_type: 'sale',
            quantity: -quantity,
            notes: 'Consumo en Consulta',
            reference_id: consultationId,
            reference_type: 'medical_record'
        });

    // C. Add to Consultation Items
    const { error: itemError } = await supabase.from("consultation_items").insert({
        clinic_id: member.clinic_id,
        medical_record_id: consultationId,
        product_id: productId,
        quantity: quantity,
        unit_price: product.sale_price,
        total_price: Number(product.sale_price) * quantity
    });

    if (itemError) return { success: false, message: "Error agregando item a consulta" };

    return { success: true, message: "Producto descontado y agregado" };
}

export async function getInventoryMovements(limit = 1000, productId?: string, warehouseId?: string) {
    const supabase = await createClient();

    // Check tenant
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: member } = await supabase
        .from("clinic_members")
        .select("clinic_id")
        .eq("user_id", user.id)
        .single();
    if (!member) return [];

    let query = supabase
        .from("view_inventory_kardex")
        .select(`
            id,
            transaction_type,
            quantity_change,
            stock_before,
            stock_after,
            reason,
            created_at,
            product_name,
            responsible_user,
            warehouse_name
        `)
        .eq("clinic_id", member.clinic_id)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (productId) {
        query = query.eq('product_id', productId);
    }

    if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId);
    }

    const { data: movements, error } = await query;

    if (error) {
        console.error("Error fetching movements:", error.message || error);
        return [];
    }

    // Map fields for UI compatibility and Translate to Spanish
    const typeMap: Record<string, { label: string, color: string }> = {
        'purchase': { label: 'COMPRA', color: 'text-emerald-600' },
        'sale': { label: 'VENTA', color: 'text-blue-600' },
        'adjustment': { label: 'AJUSTE', color: 'text-amber-600' },
        'return': { label: 'DEVOLUCIÓN', color: 'text-purple-600' },
        'expiration': { label: 'EXPIRADO', color: 'text-red-600' }
    };

    return movements.map(m => {
        const typeInfo = typeMap[m.transaction_type] || { label: m.transaction_type?.toUpperCase(), color: 'text-slate-600' };
        return {
            ...m,
            type: typeInfo.label,
            typeColor: typeInfo.color,
            quantity_change: m.quantity_change,
            reason: m.reason
        };
    });
}

export async function deductStockFEFO(
    supabaseAdmin: any,
    clinicId: string,
    productId: string,
    warehouseId: string,
    quantityToDeduct: number,
    userId: string,
    transactionType: 'consumption' | 'sale' | 'adjustment' | 'expiration' | 'transfer',
    notes: string,
    referenceId?: string,
    referenceType?: string
) {
    if (quantityToDeduct <= 0) return { success: true };

    // 1. Obtener lotes activos del producto en el almacén seleccionado ordenados por FEFO
    const { data: batches, error: batchErr } = await supabaseAdmin
        .from("inventory_batches")
        .select("*")
        .eq("product_id", productId)
        .eq("warehouse_id", warehouseId)
        .gt("quantity", 0)
        .order("expiry_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });

    if (batchErr || !batches || batches.length === 0) {
        throw new Error("No hay stock disponible en el almacén seleccionado para este producto.");
    }

    // Verificar si el stock total en el almacén es suficiente
    const totalAvailable = batches.reduce((sum: number, b: any) => sum + Number(b.quantity), 0);
    if (totalAvailable < quantityToDeduct) {
        throw new Error(`Stock insuficiente en el almacén. Solicitado: ${quantityToDeduct}, Disponible: ${totalAvailable}`);
    }

    let remaining = quantityToDeduct;

    for (const batch of batches) {
        if (remaining <= 0) break;
        const take = Math.min(Number(batch.quantity), remaining);

        // Actualizar la cantidad del lote
        const { error: updateErr } = await supabaseAdmin
            .from("inventory_batches")
            .update({ quantity: Number(batch.quantity) - take })
            .eq("id", batch.id);

        if (updateErr) throw updateErr;

        // Registrar la transacción
        const { error: txErr } = await supabaseAdmin
            .from("inventory_transactions")
            .insert({
                clinic_id: clinicId,
                product_id: productId,
                batch_id: batch.id,
                warehouse_id: warehouseId,
                transaction_type: transactionType,
                quantity: -take,
                notes: notes,
                created_by: userId,
                reference_id: referenceId || null,
                reference_type: referenceType || null
            });

        if (txErr) throw txErr;

        remaining -= take;
    }

    return { success: true };
}

export async function addStockManual(
    supabaseAdmin: any,
    clinicId: string,
    productId: string,
    warehouseId: string,
    quantityToAdd: number,
    userId: string,
    transactionType: 'purchase' | 'adjustment' | 'return',
    notes: string
) {
    if (quantityToAdd <= 0) return { success: true };

    // 1. Crear un lote nuevo para el ingreso manual para trazabilidad FEFO
    const batchNumber = "AJUSTE-ING-" + new Date().toISOString().slice(0, 10) + "-" + Math.floor(1000 + Math.random() * 9000);
    const { data: newBatch, error: batchErr } = await supabaseAdmin
        .from("inventory_batches")
        .insert({
            product_id: productId,
            warehouse_id: warehouseId,
            batch_number: batchNumber,
            expiry_date: null,
            quantity: quantityToAdd
        })
        .select()
        .single();

    if (batchErr || !newBatch) throw batchErr || new Error("Error registrando lote");

    // 2. Registrar la transacción
    const { error: txErr } = await supabaseAdmin
        .from("inventory_transactions")
        .insert({
            clinic_id: clinicId,
            product_id: productId,
            batch_id: newBatch.id,
            warehouse_id: warehouseId,
            transaction_type: transactionType,
            quantity: quantityToAdd,
            notes: notes,
            created_by: userId
        });

    if (txErr) throw txErr;

    return { success: true };
}

export async function adjustInventory(
    productId: string,
    warehouseId: string,
    quantity: number,
    type: 'consumption' | 'adjustment' | 'return',
    notes: string
) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "No autorizado" };

    const { data: member } = await supabaseAdmin
        .from("clinic_members")
        .select("clinic_id")
        .eq("user_id", user.id)
        .single();

    if (!member) return { success: false, message: "No asociado a una clínica" };

    try {
        if (quantity < 0) {
            // Retirar stock (consumo)
            await deductStockFEFO(
                supabaseAdmin,
                member.clinic_id,
                productId,
                warehouseId,
                Math.abs(quantity),
                user.id,
                type as any,
                notes
            );
        } else if (quantity > 0) {
            // Agregar stock (ingreso)
            await addStockManual(
                supabaseAdmin,
                member.clinic_id,
                productId,
                warehouseId,
                quantity,
                user.id,
                type === 'return' ? 'return' : 'adjustment',
                notes
            );
        }
        
        revalidatePath("/dashboard/inventory");
        revalidatePath("/dashboard/inventory/movements");
        return { success: true, message: "Inventario ajustado correctamente" };
    } catch (err: any) {
        console.error("Error in adjustInventory:", err);
        return { success: false, message: err.message || "Error al ajustar inventario" };
    }
}
