"use client";

import {ColumnDef} from "@tanstack/react-table";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {cn} from "@/lib/utils/utils";
import {HugeIcon} from "@/components/huge-icon";
import {TRANSACTION_MODULE_LABELS} from "@/lib/enums";

function formatPricingAmount(price: string | number) {
    const num = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(num)) return "0.00";
    return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
    }).format(num);
}

function StatusBadge({effectiveFrom}: { effectiveFrom: Date }) {
    const now = new Date();
    const d = new Date(effectiveFrom);
    if (d <= now) {
        return (
            <Badge variant="outline"
                   className="text-[10px] uppercase font-bold text-emerald-600 border-emerald-200 bg-emerald-50 rounded-full">
                <HugeIcon name="Tick01Icon" size={12} className="mr-1"/> Active
            </Badge>
        );
    }
    return (
        <Badge variant="secondary" className="text-[10px] uppercase font-bold rounded-full">
            <HugeIcon name="Calendar03Icon" size={12} className="mr-1"/> Scheduled
        </Badge>
    );
}

export const getColumns = (
    onEdit: (rule: any) => void,
    setRuleToDelete: (rule: any) => void,
    isPending: boolean,
    isGlobal: boolean
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
        id: "scope",
        accessorFn: (row) => row.userName || "System Global",
        header: ({column}) => {
            const isSorted = column.getIsSorted();
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(isSorted === "asc")}
                        className="-ml-4 h-8 text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 data-[active=true]:text-primary"
                        data-active={!!isSorted}>
                    {isGlobal ? "Scope" : "User Account"}
                    <HugeIcon
                        name={isSorted ? (isSorted === "asc" ? "ArrowUp01Icon" : "ArrowDown01Icon") : "Sorting05Icon"}
                        size={14}
                        className={cn("ml-2 transition-transform", isSorted ? "text-primary" : "opacity-50")}/>
                </Button>
            );
        },
        cell: ({row}) => {
            const r = row.original;
            if (r.userId) {
                return (
                    <div className="flex items-center gap-3">
                        <Avatar
                            className="size-9 border-2 border-background shadow-sm group-hover:border-primary/20 transition-all">
                            <AvatarImage src={r.userImage || undefined}/>
                            <AvatarFallback className="text-[10px] font-bold bg-primary/5 text-primary">
                                {r.userName?.slice(0, 2).toUpperCase() || "US"}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-bold text-sm tracking-tight leading-none mb-1">{r.userName}</p>
                            <p className="text-[11px] text-muted-foreground font-medium">{r.userEmail}</p>
                        </div>
                    </div>
                );
            }
            return (
                <div className="flex items-center gap-3">
                    <div
                        className="size-9 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                        <HugeIcon name="GlobalIcon" size={16}/>
                    </div>
                    <span className="text-sm font-black tracking-tight text-primary">System Global</span>
                </div>
            );
        },
    },
    {
        accessorKey: "module",
        header: ({column}) => {
            const isSorted = column.getIsSorted();
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(isSorted === "asc")}
                        className="-ml-4 h-8 text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 data-[active=true]:text-primary"
                        data-active={!!isSorted}>
                    Module
                    <HugeIcon
                        name={isSorted ? (isSorted === "asc" ? "ArrowUp01Icon" : "ArrowDown01Icon") : "Sorting05Icon"}
                        size={14}
                        className={cn("ml-2 transition-transform", isSorted ? "text-primary" : "opacity-50")}/>
                </Button>
            );
        },
        cell: ({row}) => {
            const mod = row.original.module;
            return (
                <Badge variant="outline"
                       className="text-[10px] uppercase font-black bg-background/50 border-muted-foreground/20">
                    {TRANSACTION_MODULE_LABELS[mod as keyof typeof TRANSACTION_MODULE_LABELS] ?? mod}
                </Badge>
            );
        },
    },
    {
        accessorKey: "unitPrice",
        header: ({column}) => {
            const isSorted = column.getIsSorted();
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(isSorted === "asc")}
                        className="-ml-4 h-8 text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 data-[active=true]:text-primary"
                        data-active={!!isSorted}>
                    Unit Price
                    <HugeIcon
                        name={isSorted ? (isSorted === "asc" ? "ArrowUp01Icon" : "ArrowDown01Icon") : "Sorting05Icon"}
                        size={14}
                        className={cn("ml-2 transition-transform", isSorted ? "text-primary" : "opacity-50")}/>
                </Button>
            );
        },
        cell: ({row}) => {
            const r = row.original;
            return (
                <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                        <span className="font-mono text-sm font-black text-foreground">
                            {formatPricingAmount(r.unitPrice)}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground">MYR</span>
                    </div>
                    <span
                        className="text-[10px] text-muted-foreground font-medium lowercase italic">per {r.action}</span>
                </div>
            );
        },
    },
    {
        id: "status",
        accessorFn: (row) => row.effectiveFrom,
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
        cell: ({row}) => <StatusBadge effectiveFrom={new Date(row.original.effectiveFrom)}/>,
    },
    {
        accessorKey: "effectiveFrom",
        header: ({column}) => {
            const isSorted = column.getIsSorted();
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(isSorted === "asc")}
                        className="-ml-4 h-8 text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 data-[active=true]:text-primary"
                        data-active={!!isSorted}>
                    Effective From
                    <HugeIcon
                        name={isSorted ? (isSorted === "asc" ? "ArrowUp01Icon" : "ArrowDown01Icon") : "Sorting05Icon"}
                        size={14}
                        className={cn("ml-2 transition-transform", isSorted ? "text-primary" : "opacity-50")}/>
                </Button>
            );
        },
        cell: ({row}) => {
            const d = new Date(row.original.effectiveFrom);
            return (
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">
                        {d.toLocaleDateString(undefined, {dateStyle: 'medium'})}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                        {d.toLocaleTimeString(undefined, {timeStyle: 'short'})}
                    </span>
                </div>
            );
        },
    },
    {
        id: "actions",
        header: () => <div className="w-12"/>,
        cell: ({row}) => {
            const r = row.original;
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 rounded-full">
                            <HugeIcon name="MoreHorizontalIcon" size={16}/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onEdit(r)} disabled={isPending}
                                          className="font-bold cursor-pointer">
                            <HugeIcon name="PencilEdit01Icon" size={14} className="mr-2 text-primary"/> Edit Rule
                        </DropdownMenuItem>
                        {r.note && (
                            <>
                                <DropdownMenuSeparator/>
                                <div className="px-2 py-1.5 text-[10px] text-muted-foreground italic">
                                    Note: {r.note}
                                </div>
                            </>
                        )}
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem
                            className="text-destructive font-bold focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                            onClick={() => setRuleToDelete(r)}
                            disabled={isPending}
                        >
                            <HugeIcon name="Delete02Icon" size={14} className="mr-2"/>
                            Delete Rule
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
