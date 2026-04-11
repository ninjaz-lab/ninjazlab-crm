"use client";

import {useState} from "react";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {ChevronLeft, ChevronRight, Search} from "lucide-react";
import {UserDetailSheet} from "./user-detail-sheet";
import {useRouter, useSearchParams} from "next/navigation";
import {cn, formatAmount} from "@/lib/utils";
import {USER_ROLES} from "@/lib/enums";

export function UsersTable({
                               users,
                               total,
                               currentUserId,
                               page,
                               pageSize
                           }: {
    currentUserId: string;
    users: any[];
    total: number;
    page: number;
    pageSize: number;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [detailUserId, setDetailUserId] = useState<string | null>(null);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    function handleSearch(term: string) {
        const params = new URLSearchParams(searchParams);
        if (term)
            params.set("q", term);
        else params.delete("q");
        params.set("page", "1");
        router.push(`?${params.toString()}`);
    }

    function changePage(newPage: number) {
        const params = new URLSearchParams(searchParams);
        params.set("page", newPage.toString());
        router.push(`?${params.toString()}`);
    }

    return (
        <div className="space-y-4">
            {/* Header: Search + Top Pagination */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"/>
                    <Input
                        placeholder="Search name or email..."
                        className="pl-8 bg-background"
                        defaultValue={searchParams.get("q") ?? ""}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>

                <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <span>{page} / {totalPages}</span>
                    <div className="flex gap-1">
                        <Button variant="outline" size="icon" className="size-8" disabled={page <= 1}
                                onClick={() => changePage(page - 1)}>
                            <ChevronLeft className="size-4"/>
                        </Button>
                        <Button variant="outline" size="icon" className="size-8" disabled={page >= totalPages}
                                onClick={() => changePage(page + 1)}>
                            <ChevronRight className="size-4"/>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="w-[60px] text-center font-bold">#</TableHead>
                            <TableHead className="font-bold">User</TableHead>
                            <TableHead className="font-bold">Role</TableHead>
                            <TableHead className="font-bold">Wallet Balance</TableHead>
                            <TableHead className="font-bold">Status</TableHead>
                            <TableHead className="w-10"/>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((u, index) => {
                            const isSelf = u.id === currentUserId;
                            const balance = parseFloat(u.balance ?? "0");
                            const rowNumber = (page - 1) * pageSize + index + 1;

                            return (
                                <TableRow
                                    key={u.id}
                                    className="cursor-pointer hover:bg-muted/40 transition-all group"
                                    onClick={() => setDetailUserId(u.id)}
                                >
                                    <TableCell className="text-center text-xs font-mono text-muted-foreground">
                                        {rowNumber}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="size-9 border shadow-sm">
                                                <AvatarImage src={u.image || undefined} alt={u.name}/>
                                                <AvatarFallback>{u.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-bold text-sm leading-none mb-1">
                                                    {u.name} {isSelf && <Badge variant="secondary"
                                                                               className="ml-1 text-[9px] h-3.5 px-1 uppercase tracking-tighter">You</Badge>}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{u.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={u.role === USER_ROLES.ADMIN ? "default" : "secondary"}
                                               className="text-[10px] uppercase font-black tracking-tight">
                                            {u.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className={cn(
                                        "font-mono text-sm font-black",
                                        balance < 0 ? "text-rose-600" : "text-emerald-600"
                                    )}>
                                        {formatAmount(balance)} MYR
                                    </TableCell>
                                    <TableCell>
                                        {u.banned ?
                                            <Badge variant="destructive"
                                                   className="rounded-full font-bold">Banned</Badge> :
                                            <Badge variant="outline"
                                                   className="text-emerald-600 border-emerald-200 bg-emerald-50 rounded-full font-bold">Active</Badge>
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <ChevronRight
                                            className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0"/>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>

                {/* 🚩 FOOTER PAGINATION: This ensures visibility at the bottom */}
                <div className="px-6 py-4 border-t bg-muted/10 flex items-center justify-between">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Total {total} Records
                    </p>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-muted-foreground">
                            Page {page} of {totalPages}
                        </span>
                        <div className="flex gap-1">
                            <Button variant="outline" size="icon" className="size-8" disabled={page <= 1}
                                    onClick={() => changePage(page - 1)}>
                                <ChevronLeft className="size-4"/>
                            </Button>
                            <Button variant="outline" size="icon" className="size-8" disabled={page >= totalPages}
                                    onClick={() => changePage(page + 1)}>
                                <ChevronRight className="size-4"/>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <UserDetailSheet
                userId={detailUserId}
                open={!!detailUserId}
                onOpenChangeAction={(open) => {
                    if (!open)
                        setDetailUserId(null);
                }}
            />
        </div>
    );
}