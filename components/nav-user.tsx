"use client";

import {useRouter} from "next/navigation";
import {SidebarMenu, SidebarMenuButton, SidebarMenuItem,} from "@/components/ui/sidebar";
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
import {USER_ROLES} from "@/lib/enums";
import {HugeIcon} from "@/components/huge-icon";
import {cn} from "@/lib/utils/utils";
import {Routes} from "@/lib/constants/routes";

interface Props {
    variant: USER_ROLES.USER | USER_ROLES.ADMIN;
}

export function NavUser({variant}: Props) {
    const {data: session} = useSession();
    const router = useRouter();

    const name = session?.user?.name ?? "User";
    const email = session?.user?.email ?? "";
    const image = session?.user?.image ?? undefined;
    const role = session?.user?.role ?? USER_ROLES.USER;
    const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

    async function handleSignOut() {
        await signOut();
        router.push(Routes.LOGIN);
    }

    // Dynamic classes based on the active sidebar variant
    const isUser = variant === USER_ROLES.USER;
    const avatarFallbackColor = isUser ? "bg-primary/10 text-primary" : "bg-rose-50 text-rose-600";
    const hoverBgColor = isUser ? "focus:bg-primary/10 focus:text-primary" : "focus:bg-rose-50 focus:text-rose-600";
    const hoverIconColor = isUser ? "group-focus:text-primary" : "group-focus:text-rose-600";

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
                                <AvatarFallback className={cn("rounded-lg font-bold", avatarFallbackColor)}>
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
                            <DropdownMenuItem onClick={() => router.push("/settings")}
                                              className={cn("cursor-pointer group", hoverBgColor)}>
                                <HugeIcon name="Settings02Icon" size={16}
                                          className={cn("mr-2 text-muted-foreground", hoverIconColor)}/>
                                Account settings
                            </DropdownMenuItem>

                            {/* Switch to Admin Dashboard (Shown only on User side if Admin) */}
                            {isUser && role === USER_ROLES.ADMIN && (
                                <DropdownMenuItem onClick={() => router.push("/admin")}
                                                  className="text-rose-600 font-bold cursor-pointer group focus:bg-rose-50 focus:text-rose-600">
                                    <HugeIcon name="Shield02Icon" size={16} className="mr-2 group-focus:text-rose-600"/>
                                    Admin Dashboard
                                </DropdownMenuItem>
                            )}

                            {/* Switch to User Dashboard (Shown only on Admin side) */}
                            {!isUser && (
                                <DropdownMenuItem onClick={() => router.push(Routes.HOME)}
                                                  className="text-primary font-bold cursor-pointer group focus:bg-primary/10 focus:text-primary">
                                    <HugeIcon name="DashboardCircleIcon" size={16}
                                              className="mr-2 group-focus:text-primary"/>
                                    User Dashboard
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator/>

                        <DropdownMenuItem onClick={handleSignOut}
                                          className="text-destructive cursor-pointer group focus:bg-destructive/10 focus:text-destructive">
                            <HugeIcon name="Logout01Icon" size={16} className="mr-2 group-focus:text-destructive"/>
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}