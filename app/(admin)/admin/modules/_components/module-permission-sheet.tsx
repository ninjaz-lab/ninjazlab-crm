"use client";

import {useMemo, useState, useTransition} from "react";
import {setModulePermission} from "@/lib/actions/admin/module";
import {Button} from "@/components/ui/button";
import {Switch} from "@/components/ui/switch";
import {Input} from "@/components/ui/input";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {cn} from "@/lib/utils/utils";
import {toast} from "sonner";
import {HugeIcon} from "@/components/huge-icon";
import {RoleBadge} from "@/components/role-badge";

interface ModulePermissionSheetProps {
    user: any | null;
    modules: any[];
    isOpen: boolean;
    onClose: () => void;
    // We pass this so the parent table can visually update instantly!
    onUpdateUser: (updatedUser: any) => void;
}

export function ModulePermissionSheet({
                                          user,
                                          modules,
                                          isOpen,
                                          onClose,
                                          onUpdateUser
                                      }: ModulePermissionSheetProps) {
    const [isPending, startTransition] = useTransition();
    const [moduleSearch, setModuleSearch] = useState("");

    const handleToggle = (userId: string, moduleId: string, currentlyEnabled: boolean) => {
        startTransition(async () => {
            try {
                await setModulePermission(userId, moduleId, !currentlyEnabled);
                if (user?.id === userId) {
                    onUpdateUser({
                        ...user,
                        permissions: {...user.permissions, [moduleId]: !currentlyEnabled}
                    });
                }
            } catch (e) {
                toast.error("Update failed");
            }
        });
    };

    const bulkUpdate = (enable: boolean) => {
        if (!user) return;
        startTransition(async () => {
            try {
                for (const m of modules) {
                    if (user.permissions[m.id] !== enable)
                        await setModulePermission(user.id, m.id, enable);
                }
                const updatedPerms = Object.fromEntries(modules.map(m => [m.id, enable]));
                onUpdateUser({...user, permissions: updatedPerms});
                toast.success(enable ? "All modules granted" : "All modules revoked");
            } catch (e) {
                toast.error("Bulk update failed");
            }
        });
    };

    const filteredModules = useMemo(() => {
        return modules.filter(m =>
            m.title.toLowerCase().includes(moduleSearch.toLowerCase())
        );
    }, [modules, moduleSearch]);

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent
                className="w-full sm:max-w-xl p-0 flex flex-col gap-0 border-l shadow-2xl h-full overflow-hidden">
                <SheetHeader className="p-6 border-b bg-muted/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <HugeIcon name="Shield01Icon" size={120} className="rotate-12"/>
                    </div>
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="p-2.5 bg-primary/10 rounded-xl">
                                <HugeIcon name="Shield02Icon" size={24} className="text-primary"/>
                            </div>
                            <RoleBadge role={user?.role}/>
                        </div>
                        <div>
                            <SheetTitle className="text-2xl font-black tracking-tighter">Module Access</SheetTitle>
                            <SheetDescription className="text-sm font-medium">
                                Configuring permissions for <span
                                className="text-foreground font-bold">{user?.name}</span>
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="p-4 border-b bg-background sticky top-0 z-20 space-y-3">
                    <div className="relative">
                        <HugeIcon name="Search01Icon" size={16}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                        <Input
                            placeholder="Search modules..."
                            className="h-9 pl-9 text-xs bg-muted/30 border-none focus-visible:ring-1"
                            value={moduleSearch}
                            onChange={(e) => setModuleSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm"
                                className="flex-1 h-8 text-[11px] font-bold gap-2 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                                onClick={() => bulkUpdate(true)} disabled={isPending}>
                            <HugeIcon name="Tick01Icon" size={14}/> Grant All
                        </Button>
                        <Button variant="outline" size="sm"
                                className="flex-1 h-8 text-[11px] font-bold gap-2 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                                onClick={() => bulkUpdate(false)} disabled={isPending}>
                            <HugeIcon name="Cancel01Icon" size={14}/> Revoke All
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                    {filteredModules.map((module) => {
                        const isEnabled = user?.permissions[module.id] ?? false;

                        return (
                            <div key={module.id}
                                 className={cn(
                                     "group flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300",
                                     isEnabled
                                         ? "bg-primary/[0.03] border-primary/20 shadow-sm"
                                         : "bg-background border-transparent hover:border-muted-foreground/10 hover:bg-muted/20"
                                 )}>
                                <div className="flex items-center gap-4">
                                    <div
                                        className={cn(
                                            "p-2.5 rounded-lg transition-all duration-300",
                                            isEnabled
                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                                : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/10"
                                        )}>
                                        <HugeIcon name={module.iconName} size={20} strokeWidth={2.5}/>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm tracking-tight">{module.title}</span>
                                        <span
                                            className="text-[11px] text-muted-foreground line-clamp-1 leading-tight max-w-[180px]">{module.description}</span>
                                    </div>
                                </div>
                                <Switch
                                    checked={isEnabled}
                                    disabled={isPending}
                                    onCheckedChange={() => handleToggle(user!.id, module.id, isEnabled)}
                                />
                            </div>
                        );
                    })}
                </div>

                <div className="p-6 border-t bg-muted/5 flex-shrink-0">
                    <Button variant="default" onClick={onClose} className="w-full font-bold shadow-xl">
                        Done
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
