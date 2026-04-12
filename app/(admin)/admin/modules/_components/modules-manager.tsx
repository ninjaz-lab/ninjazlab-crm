"use client";

import {useMemo, useState, useTransition} from "react";
import {setModulePermission} from "@/lib/actions/admin";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Switch} from "@/components/ui/switch";
import {Input} from "@/components/ui/input";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {TablePagination} from "@/components/table-pagination";
import {Progress} from "@/components/ui/progress";
import {
    CheckCircle2,
    DollarSign,
    Filter,
    LayoutDashboard,
    type LucideIcon,
    Mail,
    Search,
    Settings,
    Shield,
    ShieldCheck,
    ToggleLeft,
    Users,
    XCircle,
    Zap
} from "lucide-react";
import {cn} from "@/lib/utils";
import {USER_ROLES} from "@/lib/enums";
import {toast} from "sonner";

const ICON_MAP: Record<string, LucideIcon> = {
    LayoutDashboard, Users, Wallet: Users, ToggleLeft, DollarSign, Settings, Mail
};

export function ModulesManager({users, modules}: { users: any[], modules: any[] }) {
    const [isPending, startTransition] = useTransition();
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    // View States
    const [searchQuery, setSearchQuery] = useState("");
    const [moduleSearch, setModuleSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Filter Users
    const filteredUsers = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return users.filter(u =>
            u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
        );
    }, [users, searchQuery]);

    const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

    // Filter Modules in Sidebar
    const filteredModules = useMemo(() => {
        return modules.filter(m =>
            m.title.toLowerCase().includes(moduleSearch.toLowerCase())
        );
    }, [modules, moduleSearch]);

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
        if (!selectedUser) return;
        startTransition(async () => {
            for (const m of modules) {
                if (selectedUser.permissions[m.id] !== enable)
                    await setModulePermission(selectedUser.id, m.id, enable);
            }
            const updatedPerms = Object.fromEntries(modules.map(m => [m.id, enable]));
            setSelectedUser({...selectedUser, permissions: updatedPerms});
            toast.success(enable ? "All modules granted" : "All modules revoked");
        });
    };

    return (
        <div className="space-y-6">
            {/* Header: Search & Quick Filter UI */}
            <div
                className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"/>
                    <Input
                        placeholder="Search users by name or email..."
                        className="pl-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/30"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <Filter className="size-4"/>
                    <span>Showing {filteredUsers.length} Users</span>
                </div>
            </div>

            {/* Table Design */}
            <div className="rounded-xl border bg-card shadow-md overflow-hidden transition-all">
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[60px] text-center font-bold">#</TableHead>
                            <TableHead className="font-bold">User Information</TableHead>
                            <TableHead className="font-bold">Account Role</TableHead>
                            <TableHead className="font-bold">Module Coverage</TableHead>
                            <TableHead className="w-[150px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedUsers.map((user, index) => {
                            const activeCount = Object.values(user.permissions).filter(Boolean).length;
                            const progress = (activeCount / modules.length) * 100;

                            return (
                                <TableRow key={user.id} className="group transition-colors hover:bg-muted/30">
                                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                                        {(page - 1) * pageSize + index + 1}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <Avatar
                                                    className="size-10 border-2 border-background shadow-sm group-hover:border-primary/20 transition-all">
                                                    <AvatarImage src={user.image || ""}/>
                                                    <AvatarFallback className="bg-primary/5 text-primary font-bold">
                                                        {user.name?.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {activeCount === modules.length && (
                                                    <div
                                                        className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-background">
                                                        <Zap className="size-2 text-white fill-white"/>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm tracking-tight">{user.name}</span>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={user.role === USER_ROLES.ADMIN ? "default" : "outline"}
                                            className={cn(
                                                "text-[10px] uppercase font-black tracking-tighter px-2 py-0.5",
                                                user.role !== USER_ROLES.ADMIN && "bg-muted/50"
                                            )}
                                        >
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1.5 w-[160px]">
                                            <div
                                                className="flex items-center justify-between text-[10px] font-black uppercase text-muted-foreground">
                                                <span>{activeCount} / {modules.length} Active</span>
                                                <span>{Math.round(progress)}%</span>
                                            </div>
                                            <Progress value={progress} className="h-1.5 bg-muted"/>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedUser(user)}
                                            className="font-bold text-primary hover:text-primary hover:bg-primary/10 rounded-full px-4"
                                        >
                                            Configure
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>

                {filteredUsers.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="p-4 bg-muted/50 rounded-full mb-4">
                            <Users className="size-10 text-muted-foreground/40"/>
                        </div>
                        <h3 className="text-lg font-bold">No users found</h3>
                        <p className="text-sm text-muted-foreground">Try adjusting your search query.</p>
                    </div>
                )}

                <TablePagination
                    total={filteredUsers.length}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={(s) => {
                        setPageSize(s);
                        setPage(1);
                    }}
                />
            </div>

            {/* UPGRADED SLIDE-OUT PANEL */}
            <Sheet open={!!selectedUser} onOpenChange={(isOpen) => !isOpen && setSelectedUser(null)}>
                <SheetContent
                    className="w-full sm:max-w-md p-0 flex flex-col gap-0 border-l shadow-2xl overflow-hidden">
                    <SheetHeader className="p-6 border-b bg-muted/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Shield className="size-32 rotate-12"/>
                        </div>
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="p-2.5 bg-primary/10 rounded-xl">
                                    <ShieldCheck className="size-6 text-primary"/>
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

                    {/* Quick Search & Bulk Actions */}
                    <div className="p-4 border-b bg-background sticky top-0 z-20 space-y-3">
                        <div className="relative">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground"/>
                            <Input
                                placeholder="Search modules..."
                                className="h-9 pl-9 text-xs bg-muted/30 border-none focus-visible:ring-1"
                                value={moduleSearch}
                                onChange={(e) => setModuleSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8 text-[11px] font-bold gap-2 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                                onClick={() => bulkUpdate(true)}
                                disabled={isPending}
                            >
                                <CheckCircle2 className="size-3"/> Grant All
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8 text-[11px] font-bold gap-2 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                                onClick={() => bulkUpdate(false)}
                                disabled={isPending}
                            >
                                <XCircle className="size-3"/> Revoke All
                            </Button>
                        </div>
                    </div>

                    {/* Module List with Visual States */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                        {filteredModules.map((module) => {
                            const isEnabled = selectedUser?.permissions[module.id] ?? false;
                            const Icon = ICON_MAP[module.iconName] || Settings;

                            return (
                                <div
                                    key={module.id}
                                    className={cn(
                                        "group flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300",
                                        isEnabled
                                            ? "bg-emerald-500/[0.03] border-emerald-500/20 shadow-sm"
                                            : "bg-background border-transparent hover:border-muted-foreground/10 hover:bg-muted/20"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "p-2.5 rounded-lg transition-all duration-300",
                                            isEnabled
                                                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                                : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/10"
                                        )}>
                                            <Icon className="size-5" strokeWidth={isEnabled ? 2.5 : 2}/>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm tracking-tight">{module.title}</span>
                                            <span
                                                className="text-[11px] text-muted-foreground line-clamp-1 leading-tight max-w-[180px]">
                                                {module.description}
                                            </span>
                                        </div>
                                    </div>

                                    <Switch
                                        checked={isEnabled}
                                        disabled={isPending}
                                        onCheckedChange={() => handleToggle(selectedUser!.id, module.id, isEnabled)}
                                        className="data-[state=checked]:bg-emerald-500 shadow-sm"
                                    />
                                </div>
                            );
                        })}
                    </div>

                    <div className="p-6 border-t bg-muted/5 flex-shrink-0">
                        <Button variant="default" onClick={() => setSelectedUser(null)}
                                className="w-full font-bold shadow-xl">
                            Finish Configuration
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}