"use client";

import {useState} from "react";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {ArrowUpRight, Filter, Search, ShieldAlert, UserCheck, Users, Zap} from "lucide-react";
import {UserDetailSheet} from "./user-detail-sheet";
import {useRouter, useSearchParams} from "next/navigation";
import {cn, formatAmount} from "@/lib/utils";
import {USER_ROLES} from "@/lib/enums";
import {TablePagination} from "@/components/table-pagination";

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
        if (term) params.set("q", term);
        else params.delete("q");
        params.set("page", "1");
        router.push(`?${params.toString()}`);
    }

    function changePage(newPage: number) {
        const params = new URLSearchParams(searchParams);
        params.set("page", newPage.toString());
        router.push(`?${params.toString()}`);
    }

    function changePageSize(newSize: number) {
        const params = new URLSearchParams(searchParams);
        params.set("pageSize", String(newSize));
        params.set("page", "1");
        router.push(`?${params.toString()}`);
    }

    return (
        <div className="space-y-6">
            {/* Search Header matching the new UI style */}
            <div
                className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"/>
                    <Input
                        placeholder="Search name, email or ID..."
                        className="pl-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/30"
                        defaultValue={searchParams.get("q") ?? ""}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
                <div
                    className="flex items-center gap-2 text-sm text-muted-foreground font-medium bg-muted/50 px-3 py-1.5 rounded-lg border border-muted-foreground/10">
                    <Filter className="size-4"/>
                    <span>Page {page} of {totalPages}</span>
                </div>
            </div>

            <div className="rounded-xl border bg-card shadow-md overflow-hidden transition-all">
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow className="hover:bg-transparent">
                            <TableHead
                                className="w-[60px] text-center font-bold text-xs uppercase tracking-tighter">#</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-tighter">User
                                Identity</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-tighter">Role</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-tighter">Wallet
                                Balance</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-tighter">Status</TableHead>
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
                                    className="cursor-pointer group transition-colors hover:bg-muted/30"
                                    onClick={() => setDetailUserId(u.id)}
                                >
                                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                                        {rowNumber}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <Avatar
                                                    className="size-10 border-2 border-background shadow-sm group-hover:border-primary/20 transition-all">
                                                    <AvatarImage src={u.image || undefined} alt={u.name}/>
                                                    <AvatarFallback className="bg-primary/5 text-primary font-bold">
                                                        {u.name.slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {balance > 500 && (
                                                    <div
                                                        className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 border-2 border-background">
                                                        <Zap className="size-2 text-white fill-white"/>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <p className="font-bold text-sm tracking-tight leading-none mb-1">
                                                    {u.name}
                                                    {isSelf && (
                                                        <Badge variant="secondary"
                                                               className="ml-2 text-[9px] h-4 px-1.5 uppercase font-black bg-primary/10 text-primary border-none">
                                                            You
                                                        </Badge>
                                                    )}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground font-medium">{u.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={u.role === USER_ROLES.ADMIN ? "default" : "outline"}
                                            className={cn(
                                                "text-[10px] uppercase font-black tracking-tighter px-2 py-0.5",
                                                u.role !== USER_ROLES.ADMIN && "bg-muted/50 border-muted-foreground/20"
                                            )}
                                        >
                                            {u.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5">
                                                <span className={cn(
                                                    "font-mono text-sm font-black",
                                                    balance < 0 ? "text-rose-600" : "text-emerald-600"
                                                )}>
                                                    {formatAmount(balance)}
                                                </span>
                                                <span className="text-[10px] font-bold text-muted-foreground">MYR</span>
                                            </div>
                                            <span
                                                className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Total Credits</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {u.banned ? (
                                            <Badge variant="destructive"
                                                   className="rounded-full font-black text-[9px] uppercase tracking-wider py-0.5 pr-2 pl-1 gap-1">
                                                <ShieldAlert className="size-3"/> Banned
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline"
                                                   className="text-emerald-600 border-emerald-200 bg-emerald-50 rounded-full font-black text-[9px] uppercase tracking-wider py-0.5 pr-2 pl-1 gap-1">
                                                <UserCheck className="size-3"/> Active
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div
                                            className="size-8 rounded-full bg-muted/0 group-hover:bg-primary/10 flex items-center justify-center transition-all">
                                            <ArrowUpRight
                                                className="size-4 text-muted-foreground group-hover:text-primary transition-all opacity-0 group-hover:opacity-100"/>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>

                {users.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="p-4 bg-muted/50 rounded-full mb-4">
                            <Users className="size-10 text-muted-foreground/40"/>
                        </div>
                        <h3 className="text-lg font-bold">User database empty</h3>
                        <p className="text-sm text-muted-foreground">No users match your current filter.</p>
                    </div>
                )}

                <TablePagination
                    total={total}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={changePage}
                    onPageSizeChange={changePageSize}
                />
            </div>

            <UserDetailSheet
                userId={detailUserId}
                open={!!detailUserId}
                onOpenChangeAction={(open) => {
                    if (!open) setDetailUserId(null);
                }}
            />
        </div>
    );
}