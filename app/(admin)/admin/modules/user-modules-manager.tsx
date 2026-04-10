"use client";

import {useState, useTransition} from "react";
import {setModulePermission} from "@/lib/actions/admin";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Switch} from "@/components/ui/switch";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,} from "@/components/ui/sheet";
import {
    DollarSign,
    LayoutDashboard,
    type LucideIcon,
    Mail,
    Settings,
    ShieldCheck,
    ToggleLeft,
    Users,
    Wallet
} from "lucide-react";

// Our trusty icon mapper!
const ICON_MAP: Record<string, LucideIcon> = {
    LayoutDashboard, Users, Wallet, ToggleLeft, DollarSign, Settings, Mail
};

type UserData = any; // Replace with your exact User type from getAllUsersWithPermissions
type ModuleData = any; // Replace with your exact Module type from getAllAppModules

export function UserModulesManager({users, modules}: { users: UserData[], modules: ModuleData[] }) {
    const [isPending, startTransition] = useTransition();
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

    // Handles toggling a permission directly to the database
    const handleToggle = (userId: string, moduleId: string, currentlyEnabled: boolean) => {
        startTransition(async () => {
            await setModulePermission(userId, moduleId, !currentlyEnabled);

            // Update local state so the toggle snaps visually without waiting for a full page reload
            if (selectedUser && selectedUser.id === userId) {
                setSelectedUser({
                    ...selectedUser,
                    permissions: {
                        ...selectedUser.permissions,
                        [moduleId]: !currentlyEnabled
                    }
                });
            }
        });
    };

    return (
        <>
            <div className="rounded-md border bg-background">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Active Modules</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => {
                            // Calculate how many modules this user has enabled
                            const activeCount = Object.values(user.permissions).filter(Boolean).length;

                            return (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="size-9">
                                                <AvatarImage src={user.image || ""}/>
                                                <AvatarFallback>{user.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{user.name}</span>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {activeCount === 0 ? (
                                            <Badge variant="secondary" className="text-muted-foreground">No
                                                Access</Badge>
                                        ) : activeCount === modules.length ? (
                                            <Badge
                                                className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-200">
                                                <ShieldCheck className="size-3 mr-1"/> All Access
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">{activeCount} Modules</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                                            Manage Access
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {users.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* THE SLIDE-OUT PANEL */}
            <Sheet open={!!selectedUser} onOpenChange={(isOpen) => !isOpen && setSelectedUser(null)}>
                <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                    <SheetHeader className="mb-6">
                        <SheetTitle>Manage Permissions</SheetTitle>
                        <SheetDescription>
                            Toggle access to specific platform modules for {selectedUser?.name}.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-4">
                        {modules.map((module) => {
                            const isEnabled = selectedUser?.permissions[module.id] ?? false;
                            const Icon = ICON_MAP[module.iconName] || Settings;

                            return (
                                <div
                                    key={module.id}
                                    className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                                        isEnabled ? "bg-primary/5 border-primary/20" : "bg-background"
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`p-2 rounded-lg ${isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                                            <Icon className="size-5"/>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{module.title}</span>
                                            {module.description && (
                                                <span
                                                    className="text-xs text-muted-foreground">{module.description}</span>
                                            )}
                                        </div>
                                    </div>

                                    <Switch
                                        checked={isEnabled}
                                        disabled={isPending}
                                        onCheckedChange={() => handleToggle(selectedUser!.id, module.id, isEnabled)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}