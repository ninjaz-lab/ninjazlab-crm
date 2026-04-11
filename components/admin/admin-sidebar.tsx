"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {
    BadgeCheck,
    ChevronsUpDown,
    DollarSign,
    LayoutDashboard,
    LogOut,
    LucideIcon,
    Settings,
    Shield,
    ToggleLeft,
    Users,
    Wallet,
} from "lucide-react";
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

// Icon mapper for the admin sidebar
const ADMIN_ICON_MAP: Record<string, LucideIcon> = {
    LayoutDashboard,
    Users,
    Wallet,
    ToggleLeft,
    DollarSign,
    Settings
};

function AdminNavUser() {
    const {data: session} = useSession();
    const router = useRouter();

    const name = session?.user?.name ?? "Admin";
    const email = session?.user?.email ?? "";
    const image = session?.user?.image ?? undefined;
    const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

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
                            <Avatar className="size-8 rounded-lg">
                                <AvatarImage src={image} alt={name}/>
                                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{name}</span>
                                <span className="truncate text-xs text-muted-foreground">{email}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4"/>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
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
                                    <span className="truncate font-medium">{name}</span>
                                    <span className="truncate text-xs text-muted-foreground">{email}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>

                        <DropdownMenuSeparator/>

                        <DropdownMenuGroup>

                            {/* Setting */}
                            <DropdownMenuItem onClick={() => router.push("/settings")}>
                                <BadgeCheck className="size-4 mr-2"/>
                                Settings
                            </DropdownMenuItem>

                            {/* Switch to User */}
                            <DropdownMenuGroup>
                                <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                                    <LayoutDashboard className="size-4 mr-2"/>
                                    User Dashboard
                                </DropdownMenuItem>
                            </DropdownMenuGroup>

                        </DropdownMenuGroup>

                        <DropdownMenuSeparator/>

                        {/* Sign out */}
                        <DropdownMenuItem onClick={handleSignOut}>
                            <LogOut className="size-4"/>
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
                if (adminModules.length === 0) {
                    setIsLoading(true);
                }
                const modules = await fetchAdminModules();
                setAdminModules(modules);
            } catch (error) {
                console.error("Failed to fetch admin modules:", error);
            } finally {
                setIsLoading(false);
            }
        }

        loadModules();
    }, [adminModules.length, setAdminModules]);

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/admin">
                                <div
                                    className="flex aspect-square size-8 items-center justify-center rounded-lg bg-destructive text-destructive-foreground">
                                    <Shield className="size-4"/>
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">NinjazCRM</span>
                                    <span className="truncate text-xs text-muted-foreground">Admin Panel</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Administration</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {isLoading ? (
                                <div className="px-4 py-2 text-xs text-muted-foreground animate-pulse">
                                    Loading modules...
                                </div>
                            ) : (
                                adminModules.map((item) => {
                                    const isActive = item.exact
                                        ? pathname === item.href
                                        : pathname.startsWith(item.href);

                                    const IconComponent = ADMIN_ICON_MAP[item.iconName] || Settings;

                                    return (
                                        <SidebarMenuItem key={item.id}>
                                            <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                                                <Link href={item.href}>
                                                    <IconComponent/>
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
