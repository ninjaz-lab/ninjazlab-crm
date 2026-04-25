"use client";

import {useModulePermissions} from "@/hooks/use-module-permissions";
import {HugeIcon} from "@/components/huge-icon";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Switch} from "@/components/ui/switch";
import {Loader2} from "lucide-react";
import {USER_ROLES} from "@/lib/enums";
import {cn} from "@/lib/utils/utils";

interface Props {
    user: any;
    allModules: any[];
    onUpdateUser: (updatedUser: any) => void;
}

export function UserTabModules({user, allModules, onUpdateUser}: Props) {
    const {
        isPending, pendingMessage,
        moduleSearch, setModuleSearch,
        handleToggle,
        bulkUpdate,
        adminModules, userModules,
        filteredModules
    } = useModulePermissions(user, allModules, onUpdateUser);

    const renderModuleList = (list: any[], scope: USER_ROLES.USER | USER_ROLES.ADMIN) => {
        return list.map((module) => {
            const isEnabled = user?.permissions?.[module.id] ?? false;
            const isAdmin = scope === USER_ROLES.ADMIN;

            const theme = isAdmin ? {
                activeBg: "bg-admin",
                activeText: "text-admin-foreground",
                borderActive: "border-admin/20",
                lightBg: "bg-admin/[0.03]",
                switchColor: "data-[state=checked]:bg-admin"
            } : {
                activeBg: "bg-primary",
                activeText: "text-primary-foreground",
                borderActive: "border-primary/20",
                lightBg: "bg-primary/[0.03]",
                switchColor: "data-[state=checked]:bg-primary"
            };

            return (
                <div key={module.id}
                     className={cn(
                         "group flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300",
                         isEnabled
                             ? cn(theme.lightBg, theme.borderActive, "shadow-sm")
                             : "bg-background border-transparent hover:border-muted-foreground/10 hover:bg-muted/20"
                     )}>
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "p-2.5 rounded-lg transition-all duration-300",
                            isEnabled ? cn(theme.activeBg, theme.activeText, "shadow-lg") : "bg-muted text-muted-foreground"
                        )}>
                            <HugeIcon name={module.iconName || "CubeIcon"} size={20} strokeWidth={2.5}/>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm tracking-tight">{module.title}</span>
                            <span
                                className="text-[11px] text-muted-foreground line-clamp-1 leading-tight max-w-[200px]">
                                {module.description}
                            </span>
                        </div>
                    </div>
                    <Switch checked={isEnabled}
                            disabled={isPending}
                            onCheckedChange={() => handleToggle(user.id, module.id, isEnabled)}
                            className={cn(isEnabled && theme.switchColor)}
                    />
                </div>
            );
        });
    };

    const isAdminUser = user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.SUPERADMIN;

    if (isAdminUser) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10 text-center gap-4">
                <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <HugeIcon name="CrownIcon" size={50} className="text-primary"/>
                </div>
                <div>
                    <p className="text-sm font-black tracking-tight">Full Privilege Access</p>
                    <p className="text-xs text-muted-foreground font-medium mt-1 max-w-[260px]">
                        This user has administrator privileges and inherits access to all modules automatically.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            {/* Search */}
            <div className="px-6 pt-3 pb-3 shrink-0 border-b bg-background z-10">
                <div className="relative">
                    <HugeIcon name="Search01Icon" size={14}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                    <Input
                        placeholder="Filter capabilities..."
                        className="h-9 pl-9 text-xs bg-muted/30 border-muted-foreground/10 focus-visible:ring-1"
                        value={moduleSearch}
                        onChange={(e) => setModuleSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Module list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 pb-6 custom-scrollbar space-y-5">
                {isPending && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm">
                        <Loader2 className="h-7 w-7 text-primary animate-spin mb-2"/>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">{pendingMessage}</p>
                    </div>
                )}

                {userModules.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/80 flex items-center gap-1.5 pb-1.5 border-b">
                            <HugeIcon name="UserIcon" size={12}/> User Modules
                        </h3>
                        {renderModuleList(userModules, USER_ROLES.USER)}
                    </div>
                )}

                {adminModules.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-admin/80 flex items-center gap-1.5 pb-1.5 border-b">
                            <HugeIcon name="Shield02Icon" size={12}/> Admin Modules
                        </h3>
                        {renderModuleList(adminModules, USER_ROLES.ADMIN)}
                    </div>
                )}
            </div>

            {/* Bulk actions */}
            <div className="px-6 py-3 border-t bg-muted/5 flex items-center gap-2.5 shrink-0">
                <Button variant="outline"
                        className="flex-1 h-9 text-xs font-bold gap-2 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all"
                        onClick={() => bulkUpdate(true)} disabled={isPending}>
                    <HugeIcon name="Tick01Icon" size={13}/> Grant All
                </Button>
                <Button variant="outline"
                        className="flex-1 h-9 text-xs font-bold gap-2 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all"
                        onClick={() => bulkUpdate(false)} disabled={isPending}>
                    <HugeIcon name="Cancel01Icon" size={13}/> Revoke All
                </Button>
            </div>
        </div>
    );
}