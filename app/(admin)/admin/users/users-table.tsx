"use client";

import { useState } from "react";
import { setUserRole, banUser, unbanUser } from "@/lib/actions/admin";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreHorizontal, ShieldCheck, UserX, UserCheck } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  createdAt: Date;
};

export function UsersTable({ users }: { users: User[] }) {
  const [banDialog, setBanDialog] = useState<{ open: boolean; userId: string; name: string }>({
    open: false,
    userId: "",
    name: "",
  });
  const [banReason, setBanReason] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  async function handleRoleChange(userId: string, role: "user" | "admin") {
    setLoading(userId);
    await setUserRole(userId, role);
    setLoading(null);
  }

  async function handleBan() {
    setLoading(banDialog.userId);
    await banUser(banDialog.userId, banReason);
    setBanDialog({ open: false, userId: "", name: "" });
    setBanReason("");
    setLoading(null);
  }

  async function handleUnban(userId: string) {
    setLoading(userId);
    await unbanUser(userId);
    setLoading(null);
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const initials = u.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

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
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                      {u.role === "admin" ? (
                        <ShieldCheck className="mr-1 size-3" />
                      ) : null}
                      {u.role ?? "user"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.banned ? (
                      <Badge variant="destructive">Banned</Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={loading === u.id}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {u.role !== "admin" ? (
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(u.id, "admin")}
                          >
                            <ShieldCheck className="size-4" />
                            Make Admin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(u.id, "user")}
                          >
                            <UserCheck className="size-4" />
                            Remove Admin
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {u.banned ? (
                          <DropdownMenuItem onClick={() => handleUnban(u.id)}>
                            <UserCheck className="size-4" />
                            Unban User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() =>
                              setBanDialog({ open: true, userId: u.id, name: u.name })
                            }
                          >
                            <UserX className="size-4" />
                            Ban User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={banDialog.open}
        onOpenChange={(open) => setBanDialog((d) => ({ ...d, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban {banDialog.name}?</DialogTitle>
            <DialogDescription>
              This will prevent the user from signing in. You can unban them at any time.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="ban-reason">Reason</Label>
            <Input
              id="ban-reason"
              placeholder="Reason for ban..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBanDialog({ open: false, userId: "", name: "" })}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBan} disabled={!banReason}>
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
