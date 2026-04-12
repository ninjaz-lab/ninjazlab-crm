"use client";

import {ColumnDef} from "@tanstack/react-table";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {cn} from "@/lib/utils/utils";
import {formatAmount} from "@/lib/utils/transactions";
import {HugeIcon} from "@/components/huge-icon";
import {TableRowAction} from "@/components/table-row-action";
import {USER_ROLES} from "@/lib/enums";

export const getColumns = (
    currentUserId: string,
    pageIndex: number,
    pageSize: number
): ColumnDef<any>[] => [
    {
        id: "index",
        header: () => <div className="text-center font-bold uppercase text-[10px] tracking-widest w-[60px]">#</div>,
        cell: ({row, table}) => {
            const visualIndex = table.getRowModel().rows.findIndex((r) => r.id === row.id);
            const index = (pageIndex * pageSize) + visualIndex + 1;
            return <div className="text-center font-mono text-xs text-muted-foreground">{index}</div>;
        }
    },
    {
        accessorKey: "name",
        header: ({column}) => {
            const isSorted = column.getIsSorted();
            return (
                <Button variant="ghost"
                        onClick={() => column.toggleSorting(isSorted === "asc")}
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
                    <div className="relative h-10 w-10 shrink-0">
                        <Avatar
                            className="h-full w-full border-2 border-background shadow-sm group-hover:border-primary/20 transition-all">
                            <AvatarImage src={u.image || undefined} alt={u.name}/>
                            <AvatarFallback className="bg-primary/5 text-primary font-bold">
                                {u.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        {/* Role-based Avatar Badges */}
                        {u.role === USER_ROLES.SUPERADMIN ? (
                            <div
                                className="absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center bg-amber-500 rounded-full border-2 border-background shadow-sm"
                                title="Superadmin">
                                <HugeIcon name="CrownIcon" size={10} className="text-white "/>
                            </div>
                        ) : u.role === USER_ROLES.ADMIN ? (
                            <div
                                className="absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center bg-rose-600 rounded-full border-2 border-background shadow-sm"
                                title="Admin">
                                <HugeIcon name="Shield02Icon" size={10} className="text-white"/>
                            </div>
                        ) : (
                            <div
                                className="absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center bg-slate-700 rounded-full border-2 border-background shadow-sm"
                                title="User">
                                <HugeIcon name="UserIcon" size={10} className="text-white "/>
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
        id: "balance",
        accessorFn: (row) => parseFloat(row.balance ?? "0"),
        header: ({column}) => {
            const isSorted = column.getIsSorted();
            return (
                <div className="flex justify-end pr-4">
                    <Button variant="ghost" onClick={() => column.toggleSorting(isSorted === "asc")}
                            className="h-8 text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 data-[active=true]:text-primary"
                            data-active={!!isSorted}>
                        Wallet Balance
                        <HugeIcon
                            name={isSorted ? (isSorted === "asc" ? "ArrowUp01Icon" : "ArrowDown01Icon") : "Sorting05Icon"}
                            size={14}
                            className={cn("ml-2 transition-transform", isSorted ? "text-primary" : "opacity-50")}/>
                    </Button>
                </div>
            );
        },
        cell: ({row}) => {
            const balance = parseFloat(row.original.balance ?? "0");
            return (
                <div className="flex flex-col items-end text-right pr-4">
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
                <div className="flex justify-center">
                    <Button variant="ghost" onClick={() => column.toggleSorting(isSorted === "asc")}
                            className="h-8 text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 data-[active=true]:text-primary"
                            data-active={!!isSorted}>
                        Status
                        <HugeIcon
                            name={isSorted ? (isSorted === "asc" ? "ArrowUp01Icon" : "ArrowDown01Icon") : "Sorting05Icon"}
                            size={14}
                            className={cn("ml-2 transition-transform", isSorted ? "text-primary" : "opacity-50")}/>
                    </Button>
                </div>
            );
        },
        cell: ({row}) => {
            const banned = row.original.banned;
            return (
                <div className="flex justify-center">
                    {banned ? (
                        <Badge variant="destructive"
                               className="rounded-full font-black text-[9px] uppercase tracking-wider py-0.5 pr-2 pl-1 gap-1">
                            <HugeIcon name="UserBlock01Icon" size={12}/> Banned
                        </Badge>
                    ) : (
                        <Badge variant="outline"
                               className="text-emerald-600 border-emerald-200 bg-emerald-50 rounded-full font-black text-[9px] uppercase tracking-wider py-0.5 pr-2 pl-1 gap-1">
                            <HugeIcon name="UserCheck02Icon" size={12}/> Active
                        </Badge>
                    )}
                </div>
            );
        },
    },
    {
        id: "actions",
        header: () => <div className="w-10"/>,
        cell: () => (
            <div className="flex justify-end">
                <TableRowAction/>
            </div>
        )
    },
];