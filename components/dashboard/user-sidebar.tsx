"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {useTheme} from "next-themes";
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
import {HugeIcon} from "@/components/huge-icon";
import {cn} from "@/lib/utils/utils";

function NavUser() {
    const {data: session} = useSession();
    const router = useRouter();
    const {setTheme, theme} = useTheme();

    const name = session?.user?.name ?? "User";
    const email = session?.user?.email ?? "";
    const image = session?.user?.image ?? "";
    const role = session?.user?.role ?? USER_ROLES.USER;
    const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

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
                                <AvatarFallback className="rounded-lg bg-primary/5 text-primary font-bold">
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
                                <Avatar className="h-8 w-8 rounded-lg">
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
                            <DropdownMenuItem onClick={() => router.push("/settings")} className="cursor-pointer">
                                <HugeIcon name="Settings02Icon" size={16} className="mr-2 text-muted-foreground"/>
                                Account settings
                            </DropdownMenuItem>
                            {role === USER_ROLES.ADMIN && (
                                <DropdownMenuItem onClick={() => router.push("/admin")}
                                                  className="text-rose-600 cursor-pointer">
                                    <HugeIcon name="Shield01Icon" size={16} className="mr-2"/>
                                    Admin Dashboard
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator/>

                        <DropdownMenuGroup>
                            <DropdownMenuLabel
                                className="font-normal text-xs text-muted-foreground py-1">Theme</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer pl-6 relative">
                                {theme === "dark" &&
                                    <span className="absolute left-2 flex h-1.5 w-1.5 rounded-full bg-foreground"/>}
                                Dark
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("light")}
                                              className="cursor-pointer pl-6 relative">
                                {theme === "light" &&
                                    <span className="absolute left-2 flex h-1.5 w-1.5 rounded-full bg-foreground"/>}
                                Light
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("system")}
                                              className="cursor-pointer pl-6 relative">
                                {theme === "system" &&
                                    <span className="absolute left-2 flex h-1.5 w-1.5 rounded-full bg-foreground"/>}
                                System
                            </DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator/>

                        <DropdownMenuItem onClick={handleSignOut}
                                          className="text-destructive focus:bg-destructive/10 cursor-pointer">
                            <HugeIcon name="Logout01Icon" size={16} className="mr-2"/>
                            Log out
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
                        <SidebarMenuButton size="lg" asChild className="hover:bg-transparent">
                            <Link href="/">
                                <div
                                    className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20 shrink-0">
                                    <HugeIcon name="Database01Icon" size={18} variant="solid"/>
                                </div>
                                <div
                                    className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                                    <span
                                        className="truncate font-black tracking-tighter text-lg uppercase">Ninjazlab</span>
                                    <span
                                        className="truncate text-[10px] font-black uppercase tracking-widest text-emerald-600/80 -mt-1">USER</span>
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
                        User Panel
                    </SidebarGroupLabel>
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
                                                className="font-bold hover:bg-primary/5 active:scale-[0.98] transition-all"
                                            >
                                                <Link href={item.href}>
                                                    <HugeIcon name={item.iconName} size={18}
                                                              className={cn(isActive ? "text-primary" : "text-muted-foreground")}/>
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
                <NavUser/>
            </SidebarFooter>
            <SidebarRail/>
        </Sidebar>
    );
}