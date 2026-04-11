"use client";

import {useState} from "react";
import {setModulePermission} from "@/lib/actions/admin";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Switch} from "@/components/ui/switch";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";
import {Badge} from "@/components/ui/badge";
import {toast} from "sonner";

type UserWithPerms = {
    id: string;
    name: string;
    email: string;
    image: string | null;
    permissions: Record<string, boolean>;
};

const MODULE_LABELS: Record<string, string> = {
    billing: "Billing",
    reports: "Reports",
    crm: "CRM",
    inventory: "Inventory",
    analytics: "Analytics",
    support: "Support",
};

export function ModulesTable({
                                 users,
                                 modules,
                             }: {
    users: UserWithPerms[];
    modules: readonly string[];
}) {
    const [loading, setLoading] = useState<string | null>(null);
    const [localPerms, setLocalPerms] = useState<Record<string, Record<string, boolean>>>(
        () => Object.fromEntries(users.map((u) => [u.id, {...u.permissions}]))
    );

    async function handleToggle(userId: string, module: string, enabled: boolean) {
        const key = `${userId}:${module}`;
        setLoading(key);

        // Optimistically update the UI so the switch feels instant
        setLocalPerms((prev) => ({
            ...prev,
            [userId]: {...prev[userId], [module]: enabled},
        }));

        try {
            await setModulePermission(userId, module, enabled);
            toast.success(`${MODULE_LABELS[module] ?? module} access ${enabled ? 'granted' : 'revoked'}.`);
        } catch (error) {
            setLocalPerms((prev) => ({
                ...prev,
                [userId]: {...prev[userId], [module]: !enabled},
            }));
            toast.error("Failed to update permission. Please try again.");
        } finally {
            setLoading(null);
        }
    }

    return (
        <div className="rounded-md border overflow-x-auto shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="min-w-[200px] font-bold">User</TableHead>
                        {modules.map((m) => (
                            <TableHead key={m} className="text-center min-w-[100px] font-bold">
                                {MODULE_LABELS[m] ?? m}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.length === 0 && (
                        <TableRow>
                            <TableCell
                                colSpan={modules.length + 1}
                                className="text-center text-muted-foreground py-12 font-medium"
                            >
                                No regular users found.
                            </TableCell>
                        </TableRow>
                    )}
                    {users.map((u) => {
                        const initials = u.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2);
                        const enabledCount = Object.values(localPerms[u.id] ?? {}).filter(Boolean).length;

                        return (
                            <TableRow key={u.id} className="hover:bg-muted/40 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="size-8 border shadow-sm">
                                            <AvatarImage src={u.image ?? ""} alt={u.name}/>
                                            <AvatarFallback
                                                className="text-[10px] font-bold">{initials}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-bold text-sm leading-none mb-1">{u.name}</p>
                                            <p className="text-xs text-muted-foreground">{u.email}</p>
                                        </div>
                                        <Badge variant="outline"
                                               className={`ml-2 text-[10px] font-bold ${enabledCount > 0 ? 'bg-primary/5 text-primary border-primary/20' : ''}`}>
                                            {enabledCount}/{modules.length}
                                        </Badge>
                                    </div>
                                </TableCell>
                                {modules.map((m) => {
                                    const key = `${u.id}:${m}`;
                                    const enabled = localPerms[u.id]?.[m] ?? false;
                                    return (
                                        <TableCell key={m} className="text-center">
                                            <Switch
                                                checked={enabled}
                                                disabled={loading === key}
                                                onCheckedChange={(val) => handleToggle(u.id, m, val)}
                                                className="data-[state=checked]:bg-emerald-500" // Optional: makes it green when active!
                                            />
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}