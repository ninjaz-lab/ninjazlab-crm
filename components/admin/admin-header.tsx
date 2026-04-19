"use client";

import React from "react";
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
import {NotificationBell} from "@/components/notification-bell";
import {useSession} from "@/lib/auth-client";

const routeLabels: Record<string, string> = {
    "/admin": "Dashboard",
    "/admin/users": "Users",
    "/admin/accounts": "Accounts",
    "/admin/modules": "Modules",
};

export function AdminHeader() {
    const pathname = usePathname();
    const {data: session} = useSession();

    const generateBreadcrumbs = () => {
        const segments = pathname.split("/").filter(Boolean);
        const crumbs: { label: string; href: string }[] = [];
        let currentPath = "";

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            currentPath += `/${segment}`;

            if (segment === "admin")
                continue;

            crumbs.push({
                label: routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1),
                href: currentPath
            });
        }
        return crumbs;
    };

    const breadcrumbs = generateBreadcrumbs();

    return (
        <header
            className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 bg-background transition-[height] duration-300 ease-in-out">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1"/>
                <Separator orientation="vertical" className="mr-2 h-4"/>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
                        </BreadcrumbItem>

                        {breadcrumbs.length > 0 ? (
                            breadcrumbs.map((crumb, idx) => (
                                <React.Fragment key={idx}>
                                    <BreadcrumbSeparator className="hidden md:block"/>
                                    <BreadcrumbItem>
                                        {idx === breadcrumbs.length - 1 ? (
                                            <BreadcrumbPage>
                                                {crumb.label}
                                            </BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                </React.Fragment>
                            ))
                        ) : (
                            <>
                                <BreadcrumbSeparator className="hidden md:block"/>
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                                </BreadcrumbItem>
                            </>
                        )}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="flex items-center gap-2 pr2">
                {session?.user?.id && <NotificationBell userId={session.user.id}/>}
            </div>
        </header>
    );
}