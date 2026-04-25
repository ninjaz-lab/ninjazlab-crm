"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {
    Sidebar,
    SidebarFooter,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import {HugeIcon} from "@/components/huge-icon";
import {fetchGrantedModules} from "@/lib/actions/modules";
import {useModuleStore} from "@/lib/store/modules-store";
import {cn} from "@/lib/utils/utils";
import {NavUser} from "@/components/nav-user";
import {USER_ROLES} from "@/lib/enums";
import {Routes} from "@/lib/constants/routes";

export function UserSidebar() {
    const pathname = usePathname();
    const {userModules, setUserModules} = useModuleStore();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadModules() {
            try {
                if (userModules.length === 0) setIsLoading(true);
                const modules = await fetchGrantedModules();
                setUserModules(modules);
            } catch (error) {
                console.error("Failed to fetch user modules:", error);
            } finally {
                setIsLoading(false);
            }
        }

        void loadModules();
    }, [userModules.length, setUserModules]);

    return (
        <Sidebar collapsible="icon" className="border-r">
            <SidebarHeader className="pt-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-transparent transition-none">
                            <Link href={Routes.HOME}>
                                <div
                                    className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20 shrink-0">
                                    <HugeIcon name="Database01Icon" size={18} variant="solid"/>
                                </div>
                                <div
                                    className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                                    <span
                                        className="truncate font-black tracking-tighter text-lg uppercase">Ninjazlab</span>
                                    <span
                                        className="truncate text-[10px] font-black uppercase tracking-widest text-primary -mt-1">USER</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarGroupContent>
                <SidebarMenu>
                    {isLoading ? (
                        <div className="space-y-2 p-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-8 w-full animate-pulse rounded-md bg-muted/50"/>
                            ))}
                        </div>
                    ) : (
                        userModules.map((item) => {
                            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                            return (
                                <SidebarMenuItem key={item.id}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive}
                                        tooltip={item.title}
                                        className={cn(
                                            "font-bold transition-all duration-200 group active:scale-[0.98]",
                                            "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                                            "data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-md",
                                            "data-[active=true]:hover:bg-primary/90 data-[active=true]:hover:text-primary-foreground"
                                        )}
                                    >
                                        <Link href={item.href}>
                                            <HugeIcon
                                                name={item.iconName}
                                                size={18}
                                                className={cn(
                                                    "transition-all duration-300",
                                                    "opacity-70 group-hover:scale-110 group-hover:text-primary group-hover:opacity-100",
                                                    "group-data-[active=true]:text-primary-foreground group-data-[active=true]:opacity-100 group-data-[active=true]:scale-100 group-data-[active=true]:group-hover:text-primary-foreground"
                                                )}
                                            />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })
                    )}
                </SidebarMenu>
            </SidebarGroupContent>

            <SidebarFooter className="mt-auto pb-4">
                <NavUser variant={USER_ROLES.USER}/>
            </SidebarFooter>
            <SidebarRail/>
        </Sidebar>
    );
}