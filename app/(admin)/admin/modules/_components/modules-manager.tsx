"use client";

import {useMemo, useState, useTransition} from "react";
import {setModulePermission} from "@/lib/actions/admin";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Switch} from "@/components/ui/switch";
import {Input} from "@/components/ui/input";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {cn} from "@/lib/utils";
import {toast} from "sonner";
import {HugeIcon} from "@/components/huge-icon";
import {DataTable} from "@/components/data-table";
import {getColumns} from "@/app/(admin)/admin/modules/_components/columns";

export function ModulesManager({users, modules}: { users: any[], modules: any[] }) {
    const [isPending, startTransition] = useTransition();
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [moduleSearch, setModuleSearch] = useState("");

    const handleToggle = (userId: string, moduleId: string, currentlyEnabled: boolean) => {
        startTransition(async () => {
            try {
                await setModulePermission(userId, moduleId, !currentlyEnabled);
                if (selectedUser?.id === userId) {
                    setSelectedUser({
                        ...selectedUser,
                        permissions: {...selectedUser.permissions, [moduleId]: !currentlyEnabled}
                    });
                }
            } catch (e) {
                toast.error("Update failed");
            }
        });
    };

    const bulkUpdate = (enable: boolean) => {
        if (!selectedUser)
            return;
        startTransition(async () => {
            try {
                for (const m of modules) {
                    if (selectedUser.permissions[m.id] !== enable)
                        await setModulePermission(selectedUser.id, m.id, enable);
                }
                const updatedPerms = Object.fromEntries(modules.map(m => [m.id, enable]));
                setSelectedUser({...selectedUser, permissions: updatedPerms});
                toast.success(enable ? "All modules granted" : "All modules revoked");
            } catch (e) {
                toast.error("Bulk update failed");
            }
        });
    };

    // Filter Modules in Sidebar
    const filteredModules = useMemo(() => {
        return modules.filter(m =>
            m.title.toLowerCase().includes(moduleSearch.toLowerCase())
        );
    }, [modules, moduleSearch]);

    const columns = useMemo(
        () => getColumns(modules.length, setSelectedUser),
        [modules.length]
    );

    const customGlobalFilterFn = (row: any, columnId: string, filterValue: string) => {
        const name = row.original.name?.toLowerCase() || "";
        const email = row.original.email?.toLowerCase() || "";
        const val = filterValue.toLowerCase();
        return name.includes(val) || email.includes(val);
    };

    return (
        <div className="space-y-6">
            <DataTable
                columns={columns}
                data={users}
                searchPlaceholder="Filter users by name or email..."
                globalFilterFn={customGlobalFilterFn}
            />

            {/* Slide-out Panel (Kept exactly as it is) */}
            <Sheet open={!!selectedUser} onOpenChange={(isOpen) => !isOpen && setSelectedUser(null)}>
                <SheetContent
                    className="w-full sm:max-w-md p-0 flex flex-col gap-0 border-l shadow-2xl overflow-hidden">
                    <SheetHeader className="p-6 border-b bg-muted/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <HugeIcon name="Shield01Icon" size={120} className="rotate-12"/>
                        </div>
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="p-2.5 bg-primary/10 rounded-xl">
                                    <HugeIcon name="Shield02Icon" size={24} className="text-primary"/>
                                </div>
                                <Badge variant="secondary" className="font-black uppercase text-[10px]">
                                    {selectedUser?.role}
                                </Badge>
                            </div>
                            <div>
                                <SheetTitle className="text-2xl font-black tracking-tighter">Module Access</SheetTitle>
                                <SheetDescription className="text-sm font-medium">
                                    Configuring permissions for <span
                                    className="text-foreground font-bold">{selectedUser?.name}</span>
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
                            const isEnabled = selectedUser?.permissions[module.id] ?? false;

                            return (
                                <div key={module.id}
                                     className={cn("group flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300", isEnabled ? "bg-emerald-500/[0.03] border-emerald-500/20 shadow-sm" : "bg-background border-transparent hover:border-muted-foreground/10 hover:bg-muted/20")}>
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={cn("p-2.5 rounded-lg transition-all duration-300", isEnabled ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/10")}>
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
                                        onCheckedChange={() => handleToggle(selectedUser!.id, module.id, isEnabled)}
                                        className="data-[state=checked]:bg-emerald-500 shadow-sm"/>
                                </div>
                            );
                        })}
                    </div>

                    <div className="p-6 border-t bg-muted/5 flex-shrink-0">
                        <Button
                            variant="default"
                            onClick={() => setSelectedUser(null)}
                            className="w-full font-bold shadow-xl">
                            Done
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}