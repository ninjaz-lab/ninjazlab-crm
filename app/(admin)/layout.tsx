"use client"

import React from "react";
import {AdminSidebar} from "@/components/admin/admin-sidebar";
import {AdminHeader} from "@/components/admin/admin-header";
import {SidebarInset, SidebarProvider} from "@/components/ui/sidebar";
import {useAppStore} from "@/lib/store/app-store";

export default function AdminLayout({children}: { children: React.ReactNode }) {
    const {isSidebarCollapsed, setSidebarCollapsed} = useAppStore()

    return (
        <SidebarProvider open={!isSidebarCollapsed} onOpenChange={(open) => setSidebarCollapsed(!open)}>
            <AdminSidebar/>
            <SidebarInset>
                <AdminHeader/>
                <main className="flex-1 p-6">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
