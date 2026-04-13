"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {signOut, useSession} from "@/lib/auth-client";
import {useModuleStore} from "@/lib/store/modules-store";
import {fetchAdminModules} from "@/lib/actions/modules";
import {HugeIcon} from "@/components/HugeIcon";
import {cn} from "@/lib/utils";

function AdminNavUser() {
    const {data: session} = useSession();
    const router = useRouter();

    const name = session?.user?.name ?? "Admin";
    const email = session?.user?.email ?? "";
    const image = session?.user?.image ?? undefined;
    const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

    async function handleSignOut() {
        await signOut();
        router.push("/login");
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={image} alt={name}/>
                                <AvatarFallback className="rounded-lg bg-rose-50 text-rose-600 font-bold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div
                                className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                <span className="truncate font-bold">{name}</span>
                                <span className="truncate text-xs text-muted-foreground">{email}</span>
                            </div>
                            <HugeIcon name="Sorting05Icon" size={16}
                                      className="ml-auto opacity-50 group-data-[collapsible=icon]:hidden"/>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl shadow-xl border-muted-foreground/20"
                        side="bottom"
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="size-8 rounded-lg">
                                    <AvatarImage src={image} alt={name}/>
                                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-bold">{name}</span>
                                    <span className="truncate text-xs text-muted-foreground">{email}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator/>
                        <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => router.push("/settings")}
                                              className="font-bold cursor-pointer">
                                <HugeIcon name="Settings02Icon" size={16} className="mr-2 text-muted-foreground"/>
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push("/dashboard")}
                                              className="font-bold text-emerald-600 cursor-pointer">
                                <HugeIcon name="DashboardCircleIcon" size={16} className="mr-2"/>
                                User Dashboard
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem
                            onClick={handleSignOut}
                            className="font-bold text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/30 cursor-pointer"
                        >
                            <HugeIcon name="Logout01Icon" size={16} className="mr-2"/>
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

export function AdminSidebar() {
    const pathname = usePathname();
    const {adminModules, setAdminModules} = useModuleStore();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadModules() {
            try {
                if (adminModules.length === 0) setIsLoading(true);
                const modules = await fetchAdminModules();
                setAdminModules(modules);
            } catch (error) {
                console.error("Failed to fetch admin modules:", error);
            } finally {
                setIsLoading(false);
            }
        }

        void loadModules();
    }, [adminModules.length, setAdminModules]);

    return (
        <Sidebar collapsible="icon" className="border-r">
            <SidebarHeader className="pt-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-transparent transition-none">
                            <Link href="/admin">
                                <div
                                    className="flex aspect-square size-8 items-center justify-center rounded-lg bg-rose-600 text-white shadow-lg shadow-rose-600/20 shrink-0">
                                    <HugeIcon name="Shield02Icon" size={18} variant="solid"/>
                                </div>
                                <div
                                    className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                                    <span
                                        className="truncate font-black tracking-tighter text-lg uppercase">Ninjaz</span>
                                    <span
                                        className="truncate text-[10px] font-black uppercase tracking-widest text-rose-600/80 -mt-1">
                                        Control
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel
                        className="text-[10px] font-black uppercase tracking-widest px-4 opacity-50 group-data-[collapsible=icon]:hidden">
                        System Management
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {isLoading ? (
                                <div className="space-y-2 p-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-8 w-full animate-pulse rounded-md bg-muted/50"/>
                                    ))}
                                </div>
                            ) : (
                                adminModules.map((item) => {
                                    const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                                    return (
                                        <SidebarMenuItem key={item.id}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActive}
                                                tooltip={item.title}
                                                className="font-bold hover:bg-rose-500/5 active:scale-[0.98] transition-all"
                                            >
                                                <Link href={item.href}>
                                                    <HugeIcon
                                                        name={item.iconName}
                                                        size={18}
                                                        className={cn(isActive ? "text-rose-600" : "text-muted-foreground")}
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
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <AdminNavUser/>
            </SidebarFooter>
            <SidebarRail/>
        </Sidebar>
    );
}