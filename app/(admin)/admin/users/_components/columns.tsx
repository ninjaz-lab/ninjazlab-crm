"use client";

import {ColumnDef} from "@tanstack/react-table";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {cn, formatAmount} from "@/lib/utils";
import {USER_ROLES} from "@/lib/enums";
import {HugeIcon} from "@/components/huge-icon";

export const getColumns = (
    currentUserId: string,
    pageIndex: number,
    pageSize: number
): ColumnDef<any>[] => [
    {
        id: "index",
        header: () => <div className="text-center font-bold uppercase text-[10px] tracking-widest w-[60px]">#</div>,
        cell: ({row}) => {
            const index = (pageIndex * pageSize) + row.index + 1;
            return <div className="text-center font-mono text-xs text-muted-foreground">{index}</div>;
        },
    },
    {
        accessorKey: "name",
        header: ({column}) => {
            const isSorted = column.getIsSorted();
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(isSorted === "asc")}
                        className="-ml-4 h-8 text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 data-[active=true]:text-primary"
                        data-active={!!isSorted}>
                    User Information
                    <HugeIcon
                        name={isSorted ? (isSorted === "asc" ? "ArrowUp01Icon" : "ArrowDown01Icon") : "Sorting05Icon"}
                        size={14}
                        className={cn("ml-2 transition-transform", isSorted ? "text-primary" : "opacity-50")}/>
                </Button>
            );
        },
        cell: ({row}) => {
            const u = row.original;
            const isSelf = u.id === currentUserId;
            const balance = parseFloat(u.balance ?? "0");

            return (
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
                                <HugeIcon name="ZapIcon" size={10} className="text-white fill-white"/>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <p className="font-bold text-sm tracking-tight leading-none mb-1">
                            {u.name}
                            {isSelf && (
                                <Badge variant="secondary"
                                       className="ml-2 text-[9px] h-4 px-1.5 uppercase font-black bg-primary/10 text-primary border-none">You</Badge>
                            )}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-medium">{u.email}</p>
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: "role",
        header: ({column}) => {
            const isSorted = column.getIsSorted();
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(isSorted === "asc")}
                        className="-ml-4 h-8 text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 data-[active=true]:text-primary"
                        data-active={!!isSorted}>
                    Account Role
                    <HugeIcon
                        name={isSorted ? (isSorted === "asc" ? "ArrowUp01Icon" : "ArrowDown01Icon") : "Sorting05Icon"}
                        size={14}
                        className={cn("ml-2 transition-transform", isSorted ? "text-primary" : "opacity-50")}/>
                </Button>
            );
        },
        cell: ({row}) => {
            const role = row.original.role;
            return (
                <Badge variant={role === USER_ROLES.ADMIN ? "default" : "outline"}
                       className={cn("text-[10px] uppercase font-black tracking-tighter px-2 py-0.5", role !== USER_ROLES.ADMIN && "bg-muted/50 border-muted-foreground/20")}>
                    {role}
                </Badge>
            );
        },
    },
    {
        id: "balance",
        accessorFn: (row) => parseFloat(row.balance ?? "0"),
        header: ({column}) => {
            const isSorted = column.getIsSorted();
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(isSorted === "asc")}
                        className="-ml-4 h-8 text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 data-[active=true]:text-primary"
                        data-active={!!isSorted}>
                    Wallet Balance
                    <HugeIcon
                        name={isSorted ? (isSorted === "asc" ? "ArrowUp01Icon" : "ArrowDown01Icon") : "Sorting05Icon"}
                        size={14}
                        className={cn("ml-2 transition-transform", isSorted ? "text-primary" : "opacity-50")}/>
                </Button>
            );
        },
        cell: ({row}) => {
            const balance = parseFloat(row.original.balance ?? "0");
            return (
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                        <span
                            className={cn("font-mono text-sm font-black", balance < 0 ? "text-rose-600" : "text-emerald-600")}>
                            {formatAmount(balance)}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground">MYR</span>
                    </div>
                    <span
                        className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Total Credits</span>
                </div>
            );
        },
    },
    {
        accessorKey: "banned",
        header: ({column}) => {
            const isSorted = column.getIsSorted();
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(isSorted === "asc")}
                        className="-ml-4 h-8 text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 data-[active=true]:text-primary"
                        data-active={!!isSorted}>
                    Status
                    <HugeIcon
                        name={isSorted ? (isSorted === "asc" ? "ArrowUp01Icon" : "ArrowDown01Icon") : "Sorting05Icon"}
                        size={14}
                        className={cn("ml-2 transition-transform", isSorted ? "text-primary" : "opacity-50")}/>
                </Button>
            );
        },
        cell: ({row}) => {
            const banned = row.original.banned;
            return banned ? (
                <Badge variant="destructive"
                       className="rounded-full font-black text-[9px] uppercase tracking-wider py-0.5 pr-2 pl-1 gap-1">
                    <HugeIcon name="Alert01Icon" size={12}/> Banned
                </Badge>
            ) : (
                <Badge variant="outline"
                       className="text-emerald-600 border-emerald-200 bg-emerald-50 rounded-full font-black text-[9px] uppercase tracking-wider py-0.5 pr-2 pl-1 gap-1">
                    <HugeIcon name="UserTick01Icon" size={12}/> Active
                </Badge>
            );
        },
    },
    {
        id: "actions",
        header: () => <div className="w-10"/>,
        cell: () => (
            <div
                className="size-8 rounded-full bg-muted/0 group-hover:bg-primary/10 flex items-center justify-center transition-all ml-auto">
                <HugeIcon name="ArrowUpRight01Icon" size={16}
                          className="text-muted-foreground group-hover:text-primary transition-all opacity-0 group-hover:opacity-100"/>
            </div>
        ),
    },
];