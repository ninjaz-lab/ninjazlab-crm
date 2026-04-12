"use client"

import React from "react";
import {UserSidebar} from "@/components/user/user-sidebar";
import {UserHeader} from "@/components/user/user-header";
import {SidebarInset, SidebarProvider} from "@/components/ui/sidebar";
import {useAppStore} from "@/lib/store/app-store";
import {EmailVerificationBanner} from "@/components/email-verification-banner";

export default function UserLayout({children}: { children: React.ReactNode }) {
    const {isSidebarCollapsed, setSidebarCollapsed} = useAppStore()

    return (
        <SidebarProvider open={!isSidebarCollapsed} onOpenChange={(open) => setSidebarCollapsed(!open)}>
            <UserSidebar/>
            <SidebarInset>
                <EmailVerificationBanner/>
                <UserHeader/>
                <main className="flex-1 p-6">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
