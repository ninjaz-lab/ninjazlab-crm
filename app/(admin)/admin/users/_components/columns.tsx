"use client";

import {ColumnDef} from "@tanstack/react-table";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {cn} from "@/lib/utils/utils";
import {formatAmount} from "@/lib/utils/transactions";
import {HugeIcon} from "@/components/huge-icon";
import {TableRowDetailsAction} from "@/components/data-table/table-row-details-action";
import {RoleAvatar} from "@/components/role-avatar";
import {Progress} from "@/components/ui/progress";
import {USER_ROLES} from "@/lib/enums";
import {UserStatusBadge} from "@/components/user-status-badge";

export const getColumns = (
    currentUserId: string,
    totalModules: number = 0,
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
                    <RoleAvatar src={u.image}
                                name={u.name}
                                role={u.role}
                    />

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
        id: "coverage",
        accessorFn: (row) => {
            if (row.role === USER_ROLES.ADMIN || row.role === USER_ROLES.SUPERADMIN)
                return totalModules;

            return Object.values(row.permissions || {}).filter(Boolean).length;
        },
        header: ({column}) => {
            const isSorted = column.getIsSorted();
            return (
                <div className="flex justify-center">
                    <Button variant="ghost" onClick={() => column.toggleSorting(isSorted === "asc")}
                            className="h-8 text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 data-[active=true]:text-primary"
                            data-active={!!isSorted}>
                        Module Coverage
                        <HugeIcon
                            name={isSorted ? (isSorted === "asc" ? "ArrowUp01Icon" : "ArrowDown01Icon") : "Sorting05Icon"}
                            size={14}
                            className={cn("ml-2 transition-transform", isSorted ? "text-primary" : "opacity-50")}/>
                    </Button>
                </div>
            );
        },
        cell: ({row}) => {
            const u = row.original;
            const fullAccess = u.role === USER_ROLES.ADMIN || u.role === USER_ROLES.SUPERADMIN;

            if (fullAccess)
                return (
                    <div className="flex flex-col gap-1.5 w-[140px] mx-auto">
                        <div
                            className="flex items-center justify-between text-[10px] font-black uppercase text-primary">
                            <span className="flex items-center gap-1">
                                <HugeIcon name="CrownIcon" size={12} className="text-primary"/>
                                Full Access
                            </span>
                        </div>
                        <Progress value={100} className="h-1.5 bg-muted"/>
                    </div>
                );

            // Standard User UI
            const activeCount = Object.values(row.original.permissions || {}).filter(Boolean).length;
            const progress = totalModules > 0 ? (activeCount / totalModules) * 100 : 0;

            return (
                <div className="flex flex-col gap-1.5 w-[140px] mx-auto">
                    <div
                        className="flex items-center justify-between text-[10px] font-black uppercase text-muted-foreground">
                        <span>{activeCount} / {totalModules} Active</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress}
                              className="h-1.5 bg-muted"/>
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
        cell: ({row}) => (
            <div className="flex justify-center">
                <UserStatusBadge banned={row.original.banned}/>
            </div>
        ),
    },
    {
        id: "actions",
        header: () => <div className="w-10"/>,
        cell: () => (
            <div className="flex justify-end">
                <TableRowDetailsAction/>
            </div>
        )
    },
];