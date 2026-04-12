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
import {ThemeToggle} from "@/components/theme-toggle";
import {NotificationBell} from "@/components/notification-bell";
import {useAppStore} from "@/lib/store/app-store";

const routeLabels: Record<string, string> = {
    "/audience": "Audience",
    "/dashboard": "Dashboard",
    "/settings": "Settings",
};

export function UserHeader() {
    const pathname = usePathname();
    const dynamicName = useAppStore((state) => state.dynamicName);

    const generateBreadcrumbs = () => {
        const segments = pathname.split("/").filter(Boolean);
        const crumbs: {
            label: string;
            href: string;
            isDynamic?: boolean;
            isUnclickable?: boolean
        }[] = [];
        let currentPath = "";

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];

            // 1. Group "Marketing" and "Email" into one smart crumb
            if (segment === "marketing" && segments[i + 1] === "email") {
                let href = "/marketing/email";

                // Look ahead in the URL to see if we are in templates or campaigns!
                if (segments.includes("templates"))
                    href += "?tab=templates";
                else if (segments.includes("campaigns"))
                    href += "?tab=campaigns";

                crumbs.push({label: "Email Marketing", href});

                // Skip the 'email' segment since we combined them into one crumb
                i++;
                currentPath += `/email`;
                continue;
            }

            currentPath += `/${segment}`;

            if (segment === "dashboard")
                continue;

            // 2. Handle Templates specific routing
            if (segment === "templates") {
                const next = segments[i + 1];
                if (next === "new") {
                    crumbs.push({label: "New Template", href: currentPath + "/new"});
                    break;
                } else if (next) {
                    crumbs.push({label: "Edit Template", href: "#", isUnclickable: true});
                    if (dynamicName)
                        crumbs.push({label: dynamicName, href: currentPath + `/${next}`, isDynamic: true});

                    break;
                }
            }

            // 3. Handle Campaigns specific routing
            if (segment === "campaigns") {
                const next = segments[i + 1];
                if (next === "new") {
                    crumbs.push({label: "New Campaign", href: currentPath + "/new"});
                    break;
                } else if (next) {
                    crumbs.push({label: "Edit Campaign", href: "#", isUnclickable: true});
                    if (dynamicName)
                        crumbs.push({label: dynamicName, href: currentPath + `/${next}`, isDynamic: true});

                    break;
                }
            }

            // Fallback for standard routes (like /audience, /settings)
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
            className="flex h-16 w-full shrink-0 items-center justify-between border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 bg-background z-10 relative">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1"/>
                <Separator orientation="vertical" className="mr-2 h-4"/>
                <Breadcrumb>
                    <BreadcrumbList>

                        {/* Always show root */}
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="/dashboard">NinjazCRM</BreadcrumbLink>
                        </BreadcrumbItem>

                        {/* Map over dynamically generated crumbs */}
                        {breadcrumbs.map((crumb, idx) => (
                            <React.Fragment key={idx}>
                                <BreadcrumbSeparator className="hidden md:block"/>
                                <BreadcrumbItem>
                                    {idx === breadcrumbs.length - 1 || crumb.isDynamic || crumb.isUnclickable ? (
                                        <BreadcrumbPage
                                            className={crumb.isDynamic ? "font-bold text-primary truncate max-w-[300px]" : ""}>
                                            {crumb.label}
                                        </BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                            </React.Fragment>
                        ))}
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