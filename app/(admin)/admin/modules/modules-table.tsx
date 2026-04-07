"use client";

import { useState } from "react";
import { setModulePermission } from "@/lib/actions/admin";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Module } from "@/lib/db/schema";

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
  modules: readonly Module[];
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [localPerms, setLocalPerms] = useState<Record<string, Record<string, boolean>>>(
    () => Object.fromEntries(users.map((u) => [u.id, { ...u.permissions }]))
  );

  async function handleToggle(userId: string, module: Module, enabled: boolean) {
    const key = `${userId}:${module}`;
    setLoading(key);
    setLocalPerms((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [module]: enabled },
    }));
    await setModulePermission(userId, module, enabled);
    setLoading(null);
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px]">User</TableHead>
            {modules.map((m) => (
              <TableHead key={m} className="text-center min-w-[100px]">
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
                className="text-center text-muted-foreground py-8"
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
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarImage src={u.image ?? ""} alt={u.name} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <Badge variant="outline" className="ml-2 text-xs">
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
