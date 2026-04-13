"use client"

import React from "react";
import {UserSidebar} from "@/components/dashboard/user-sidebar";
import {UserHeader} from "@/components/dashboard/user-header";
import {SidebarInset, SidebarProvider} from "@/components/ui/sidebar";
import {useAppStore} from "@/lib/store/app-store";

export default function UserLayout({children}: { children: React.ReactNode }) {
    const {isSidebarCollapsed, setSidebarCollapsed} = useAppStore()

    return (
        <SidebarProvider open={!isSidebarCollapsed} onOpenChange={(open) => setSidebarCollapsed(!open)}>
            <UserSidebar/>
            <SidebarInset>
                <UserHeader/>
                <main className="flex-1 p-6">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
