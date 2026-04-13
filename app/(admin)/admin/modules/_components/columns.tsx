"use client";

import {ColumnDef} from "@tanstack/react-table";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Progress} from "@/components/ui/progress";
import {cn} from "@/lib/utils";
import {USER_ROLES} from "@/lib/enums";
import {HugeIcon} from "@/components/huge-icon";

export const getColumns = (
    totalModules: number,
    onConfigure: (user: any) => void
): ColumnDef<any>[] => [
    {
        id: "index",
        header: () => <div className="text-center font-bold uppercase text-[10px] tracking-widest w-[60px]">#</div>,
        cell: ({row, table}) => {
            const sortedIndex = table.getSortedRowModel().flatRows.findIndex(
                (r) => r.original.id === row.original.id
            );
            return <div className="text-center font-mono text-xs text-muted-foreground">{sortedIndex + 1}</div>;
        },
    },
    {
        accessorKey: "name",
        header: ({column}) => {
            const isSorted = column.getIsSorted();
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(isSorted === "asc")}
                    className="-ml-4 h-8 text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 data-[active=true]:text-primary"
                    data-active={!!isSorted}
                >
                    User Information
                    <HugeIcon
                        name={isSorted ? (isSorted === "asc" ? "ArrowUp01Icon" : "ArrowDown01Icon") : "Sorting05Icon"}
                        size={14}
                        className={cn("ml-2 transition-transform", isSorted ? "text-primary" : "opacity-50")}
                    />
                </Button>
            );
        },
        cell: ({row}) => {
            const user = row.original;
            const activeCount = Object.values(user.permissions || {}).filter(Boolean).length;

            return (
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Avatar
                            className="size-10 border-2 border-background shadow-sm group-hover:border-primary/20 transition-all">
                            <AvatarImage src={user.image || ""}/>
                            <AvatarFallback className="bg-primary/5 text-primary font-bold">
                                {user.name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        {activeCount === totalModules && totalModules > 0 && (
                            <div
                                className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-background shadow-sm">
                                <HugeIcon name="ZapIcon" size={10} className="text-white fill-white"/>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm tracking-tight">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
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
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(isSorted === "asc")}
                    className="-ml-4 h-8 text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 data-[active=true]:text-primary"
                    data-active={!!isSorted}
                >
                    Account Role
                    <HugeIcon
                        name={isSorted ? (isSorted === "asc" ? "ArrowUp01Icon" : "ArrowDown01Icon") : "Sorting05Icon"}
                        size={14}
                        className={cn("ml-2 transition-transform", isSorted ? "text-primary" : "opacity-50")}
                    />
                </Button>
            );
        },
        cell: ({row}) => {
            const role = row.original.role;
            return (
                <Badge
                    variant={role === USER_ROLES.ADMIN ? "default" : "outline"}
                    className={cn(
                        "text-[10px] uppercase font-black tracking-tighter px-2 py-0.5",
                        role !== USER_ROLES.ADMIN && "bg-muted/50"
                    )}
                >
                    {role}
                </Badge>
            );
        },
    },
    {
        id: "coverage",
        accessorFn: (row) => Object.values(row.permissions || {}).filter(Boolean).length,
        header: ({column}) => {
            const isSorted = column.getIsSorted();
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(isSorted === "asc")}
                    className="-ml-4 h-8 text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 data-[active=true]:text-primary"
                    data-active={!!isSorted}
                >
                    Module Coverage
                    <HugeIcon
                        name={isSorted ? (isSorted === "asc" ? "ArrowUp01Icon" : "ArrowDown01Icon") : "Sorting05Icon"}
                        size={14}
                        className={cn("ml-2 transition-transform", isSorted ? "text-primary" : "opacity-50")}
                    />
                </Button>
            );
        },
        cell: ({row}) => {
            const activeCount = Object.values(row.original.permissions || {}).filter(Boolean).length;
            const progress = totalModules > 0 ? (activeCount / totalModules) * 100 : 0;

            return (
                <div className="flex flex-col gap-1.5 w-[160px]">
                    <div
                        className="flex items-center justify-between text-[10px] font-black uppercase text-muted-foreground">
                        <span>{activeCount} / {totalModules} Active</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5 bg-muted"/>
                </div>
            );
        },
    },
    {
        id: "actions",
        header: () => <div className="w-[150px] text-right"/>,
        cell: ({row}) => {
            return (
                <div className="text-right">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onConfigure(row.original)}
                        className="font-bold text-primary hover:text-primary hover:bg-primary/10 rounded-full px-4"
                    >
                        Configure
                    </Button>
                </div>
            );
        },
    },
];