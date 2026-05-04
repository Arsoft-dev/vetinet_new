"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

    return data || [];
}

export async function getUnreadCount() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

    return count || 0;
}

export async function markAsRead(id: string) {
    const supabase = await createClient();
    await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
    
    revalidatePath("/");
}

export async function markAllAsRead() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id);
    
    revalidatePath("/");
}
