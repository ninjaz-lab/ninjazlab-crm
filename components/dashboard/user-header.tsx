"use client";

import {usePathname} from "next/navigation";
import {SidebarTrigger} from "@/components/ui/sidebar";
import {Separator} from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {ThemeToggle} from "@/components/theme-toggle";
import {NotificationBell} from "@/components/notification-bell";

const routeLabels: Record<string, string> = {
    "/audience": "Audience",
    "/dashboard": "Dashboard",
    "/settings": "Settings",
};

export function DashboardHeader() {
    const pathname = usePathname();
    const label = routeLabels[pathname] ?? "Page";

    return (
        <header
            className="flex h-16 w-full shrink-0 items-center justify-between border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1"/>
                <Separator orientation="vertical" className="mr-2 h-4"/>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="/dashboard">NinjazCRM</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block"/>
                        <BreadcrumbItem>
                            <BreadcrumbPage>{label}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="flex items-center gap-2">
                <NotificationBell/>
                <ThemeToggle/>
            </div>

        </header>
    );
}
