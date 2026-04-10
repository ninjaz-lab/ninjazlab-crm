"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {
    BadgeCheck,
    BookUser,
    ChevronsUpDown,
    Database,
    LayoutDashboard,
    LogOut,
    LucideIcon,
    Mail,
    Settings,
    Shield
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
import {fetchGrantedModules} from "@/lib/actions/modules";
import {USER_ROLES} from "@/lib/enums";

const USER_ICON_MAP: Record<string, LucideIcon> = {
    LayoutDashboard,
    BookUser,
    Settings,
    Mail
};

function NavUser() {
    const {data: session} = useSession();
    const router = useRouter();

    const name = session?.user?.name ?? "User";
    const email = session?.user?.email ?? "";
    const image = session?.user?.image ?? "";
    const role = session?.user?.role ?? USER_ROLES.USER;
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


                            {/* Switch to Admin */}
                            {role === USER_ROLES.ADMIN && (
                                <DropdownMenuItem onClick={() => router.push("/admin")}>
                                    <Shield className="size-4 mr-2"/>
                                    Admin Dashboard
                                </DropdownMenuItem>
                            )}

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

export function UserSidebar() {
    const pathname = usePathname();

    const {userModules, setUserModules} = useModuleStore();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadModules() {
            try {
                if (userModules.length === 0)
                    setIsLoading(true);

                const modules = await fetchGrantedModules();
                setUserModules(modules);
            } catch (error) {
                console.error("Failed to fetch user modules:", error);
            } finally {
                setIsLoading(false);
            }
        }

        loadModules();
    }, [userModules.length, setUserModules]);

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard">
                                <div
                                    className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <Database className="size-4"/>
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">NinjazCRM</span>
                                    <span className="truncate text-xs text-muted-foreground">Admin</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Platform</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {isLoading ? (
                                <div className="px-4 py-2 text-xs text-muted-foreground animate-pulse">
                                    Loading modules...
                                </div>
                            ) : (
                                userModules.map((item) => {
                                    const isActive = item.exact
                                        ? pathname === item.href
                                        : pathname.startsWith(item.href);

                                    const IconComponent = USER_ICON_MAP[item.iconName] || Settings;

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

                {/* You can optionally make this Marketing section dynamic too,
                    or leave it static if everyone gets it! */}
            </SidebarContent>

            <SidebarFooter>
                <NavUser/>
            </SidebarFooter>

            <SidebarRail/>
        </Sidebar>
    );
}
