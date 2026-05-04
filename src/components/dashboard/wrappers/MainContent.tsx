"use client";

import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

export function MainContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();

    return (
        <div className={cn(
            "min-h-screen flex flex-col print:ml-0 transition-all duration-200",
            isCollapsed ? "md:ml-20" : "md:ml-64"
        )}>
            {children}
        </div>
    );
}
