"use client";

import {ColumnDef} from "@tanstack/react-table";
import {TableRowAction, TableRowActions} from "@/components/data-table/table-row-actions";
import {HugeIcon} from "@/components/huge-icon";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {ProviderConfig} from "@/lib/types/admin";
import {cn} from "@/lib/utils/utils";
import {generateDateColumn} from "@/lib/utils/date";
import {CampaignTypeBadge} from "@/components/badge/campaign-type-badge";

export const getColumns = (
    onEdit: (provider: ProviderConfig) => void,
    setRuleToDelete: (provider: ProviderConfig) => void,
    isPending: boolean
): ColumnDef<ProviderConfig>[] => [
    {
        id: "index",
        header: () => <div className="text-center font-bold uppercase text-[10px] tracking-widest w-[60px]">#</div>,
        cell: ({row, table}) => {
            const sortedIndex = table.getSortedRowModel().flatRows.findIndex((r) => r.original.id === row.original.id);
            return <div className="text-center font-mono text-xs text-muted-foreground">{sortedIndex + 1}</div>;
        },
    },
    {
        id: "scope",
        accessorFn: (row) => row.userName || "Unknown User",
        header: ({column}) => {
            const isSorted = column.getIsSorted();
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(isSorted === "asc")}
                        className="-ml-4 h-8 text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 data-[active=true]:text-primary"
                        data-active={!!isSorted}>
                    User Account
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
        },
    },
    {
        accessorKey: "channel",
        header: ({column}) => {
            const isSorted = column.getIsSorted();
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(isSorted === "asc")}
                        className="-ml-4 h-8 text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 data-[active=true]:text-primary"
                        data-active={!!isSorted}>
                    Channel
                    <HugeIcon
                        name={isSorted ? (isSorted === "asc" ? "ArrowUp01Icon" : "ArrowDown01Icon") : "Sorting05Icon"}
                        size={14}
                        className={cn("ml-2 transition-transform", isSorted ? "text-primary" : "opacity-50")}/>
                </Button>
            );
        },
        cell: ({row}) => {
            const channel = row.original.channel;
            return <CampaignTypeBadge type={channel as any}/>;
        },
    },
    {
        accessorKey: "name",
        header: () => <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Provider
            Service</div>,
        cell: ({row}) => <span className="font-bold text-sm">{row.original.name}</span>,
    },
    generateDateColumn("updatedAt", "Last Updated"),
    {
        id: "actions",
        header: () => <div className="w-12"/>,
        cell: ({row}) => {
            const r = row.original;
            const actions: TableRowAction[] = [
                {
                    label: "Edit",
                    icon: "PencilEdit01Icon",
                    onClick: () => onEdit(r),
                    disabled: isPending,
                },
                {
                    label: "Delete",
                    icon: "Delete02Icon",
                    variant: "destructive",
                    onClick: () => setRuleToDelete(r),
                    disabled: isPending,
                },
            ];

            return (
                <div className="flex justify-end">
                    <TableRowActions actions={actions}/>
                </div>
            );
        },
    },
];
