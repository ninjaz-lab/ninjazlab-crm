"use client";

import {ColumnDef} from "@tanstack/react-table";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {HugeIcon} from "@/components/huge-icon";
import {cn} from "@/lib/utils/utils";
import {CAMPAIGN_STATUS} from "@/lib/enums";
import {TemplateRowActions} from "./template-row-actions";
import {generateDateColumn} from "@/lib/utils/date";

export const getColumns = (): ColumnDef<any>[] => [
    {
        id: "index",
        header: () => <div className="text-center font-bold uppercase text-[10px] tracking-widest w-[50px]">#</div>,
        cell: ({row, table}) => {
            const pagination = table.getState().pagination;
            const visualIndex = table.getSortedRowModel().flatRows.findIndex(
                (r) => r.original.id === row.original.id
            );
            const index = (pagination.pageIndex * pagination.pageSize) + visualIndex + 1;
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
                    Template Name
                    <HugeIcon
                        name={isSorted ? (isSorted === "asc" ? "ArrowUp01Icon" : "ArrowDown01Icon") : "Sorting05Icon"}
                        size={14}
                        className={cn("ml-2 transition-transform", isSorted ? "text-primary" : "opacity-50")}/>
                </Button>
            );
        },
        cell: ({row}) => <span className="font-bold text-sm tracking-tight">{row.original.name}</span>,
    },
    {
        accessorKey: "subject",
        header: () => <div className="font-bold uppercase text-[10px] tracking-widest">Subject Line</div>,
        cell: ({row}) => (
            <span className="text-xs text-muted-foreground font-medium max-w-[300px] truncate block">
                {row.original.subject || "—"}
            </span>
        ),
    },
    {
        accessorKey: "status",
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
            const status = row.original.status;
            return (
                <Badge variant={status === CAMPAIGN_STATUS.PUBLISHED ? "default" : "secondary"}
                       className="text-[9px] uppercase font-black tracking-widest px-2 py-0.5">
                    {status}
                </Badge>
            );
        },
    },
    generateDateColumn("updatedAt", "Last Updated"),
    {
        id: "actions",
        header: () => <div className="w-[100px]"/>,
        cell: ({row}) => (
            <div className="flex justify-end">
                <TemplateRowActions templateId={row.original.id} htmlBody={row.original.htmlBody || ""}/>
            </div>
        ),
    },
];
