"use client";

import { SidebarProvider } from "@/contexts/SidebarContext";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
        >
            <SidebarProvider>
                {children}
            </SidebarProvider>
        </ThemeProvider>
    );
}
