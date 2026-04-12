"use client";

import {ColumnDef} from "@tanstack/react-table";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {HugeIcon} from "@/components/huge-icon";
import {cn} from "@/lib/utils/utils";
import {CAMPAIGN_STATUS} from "@/lib/enums";
import {TemplateRowActions} from "./template-row-actions";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "secondary",
    scheduled: "outline",
    sending: "default",
    sent: "default",
    paused: "secondary",
    cancelled: "destructive",
    published: "default",
};

export const getColumns = (): ColumnDef<any>[] => [
    {
        id: "index",
        header: () => <div className="text-center font-bold uppercase text-[10px] tracking-widest w-[50px]">#</div>,
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
                <Button variant="ghost" onClick={() => column.toggleSorting(isSorted === "asc")}
                        className="-ml-4 h-8 text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 data-[active=true]:text-primary"
                        data-active={!!isSorted}>
                    Campaign
                    <HugeIcon
                        name={isSorted ? (isSorted === "asc" ? "ArrowUp01Icon" : "ArrowDown01Icon") : "Sorting05Icon"}
                        size={14}
                        className={cn("ml-2 transition-transform", isSorted ? "text-primary" : "opacity-50")}/>
                </Button>
            );
        },
        cell: ({row}) => (
            <Link href={`/marketing/email/campaigns/${row.original.id}`}
                  className="font-bold text-sm hover:text-primary transition-colors flex items-center gap-2">
                <HugeIcon name="Megaphone01Icon" size={14} className="text-muted-foreground"/>
                {row.original.name}
            </Link>
        ),
    },
    {
        id: "from",
        accessorFn: (row) => `${row.fromName} ${row.fromEmail}`,
        header: ({column}) => {
            const isSorted = column.getIsSorted();
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(isSorted === "asc")}
                        className="-ml-4 h-8 text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 data-[active=true]:text-primary"
                        data-active={!!isSorted}>
                    Sender Details
                    <HugeIcon
                        name={isSorted ? (isSorted === "asc" ? "ArrowUp01Icon" : "ArrowDown01Icon") : "Sorting05Icon"}
                        size={14}
                        className={cn("ml-2 transition-transform", isSorted ? "text-primary" : "opacity-50")}/>
                </Button>
            );
        },
        cell: ({row}) => (
            <div className="flex flex-col">
                <span className="font-bold text-xs tracking-tight">{row.original.fromName}</span>
                <span className="text-[10px] text-muted-foreground font-medium">{row.original.fromEmail}</span>
            </div>
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
                <Badge variant={statusVariant[status] ?? "secondary"}
                       className="uppercase text-[9px] font-black tracking-widest px-2 py-0.5">
                    {status}
                </Badge>
            );
        },
    },
    {
        accessorKey: "totalRecipients",
        header: () => <div className="font-bold uppercase text-[10px] tracking-widest">Recipients</div>,
        cell: ({row}) => <div className="font-mono text-xs font-bold">{row.original.totalRecipients}</div>,
    },
    {
        id: "engagement",
        header: () => <div className="font-bold uppercase text-[10px] tracking-widest">Engagement</div>,
        cell: ({row}) => {
            const c = row.original;
            const openRate = c.sentCount > 0 ? ((c.openedCount / c.sentCount) * 100).toFixed(1) : "0.0";
            return (
                <div className="flex flex-col gap-1 w-[100px]">
                    <div
                        className="flex items-center justify-between text-[9px] font-black uppercase text-muted-foreground">
                        <span>{c.sentCount} Sent</span>
                        <span className="text-emerald-600">{openRate}%</span>
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: "scheduledAt",
        header: ({column}) => {
            const isSorted = column.getIsSorted();
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(isSorted === "asc")}
                        className="-ml-4 h-8 text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 data-[active=true]:text-primary"
                        data-active={!!isSorted}>
                    Date
                    <HugeIcon
                        name={isSorted ? (isSorted === "asc" ? "ArrowUp01Icon" : "ArrowDown01Icon") : "Sorting05Icon"}
                        size={14}
                        className={cn("ml-2 transition-transform", isSorted ? "text-primary" : "opacity-50")}/>
                </Button>
            );
        },
        cell: ({row}) => {
            if (!row.original.scheduledAt) return <span className="text-muted-foreground text-xs">—</span>;
            const d = new Date(row.original.scheduledAt);
            return (
                <div className="flex flex-col">
                    <span
                        className="text-xs font-bold text-foreground">{d.toLocaleDateString(undefined, {dateStyle: 'medium'})}</span>
                    <span
                        className="text-[10px] font-mono text-muted-foreground">{d.toLocaleTimeString(undefined, {timeStyle: 'short'})}</span>
                </div>
            );
        },
    },
];

// 2. TEMPLATES COLUMNS
export const getTemplateColumns = (): ColumnDef<any>[] => [
    {
        id: "index",
        header: () => <div className="text-center font-bold uppercase text-[10px] tracking-widest w-[50px]">#</div>,
        cell: ({row, table}) => {
            const pagination = table.getState().pagination;
            const index = (pagination.pageIndex * pagination.pageSize) + row.index + 1;
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
    {
        accessorKey: "updatedAt",
        header: ({column}) => {
            const isSorted = column.getIsSorted();
            return (
                <div className="text-right">
                    <Button variant="ghost" onClick={() => column.toggleSorting(isSorted === "asc")}
                            className="-mr-4 h-8 text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 data-[active=true]:text-primary"
                            data-active={!!isSorted}>
                        Last Updated
                        <HugeIcon
                            name={isSorted ? (isSorted === "asc" ? "ArrowUp01Icon" : "ArrowDown01Icon") : "Sorting05Icon"}
                            size={14}
                            className={cn("ml-2 transition-transform", isSorted ? "text-primary" : "opacity-50")}/>
                    </Button>
                </div>
            );
        },
        cell: ({row}) => {
            const d = new Date(row.original.updatedAt);
            return (
                <div className="flex flex-col text-right">
                    <span
                        className="text-xs font-bold text-foreground">{d.toLocaleDateString(undefined, {dateStyle: 'medium'})}</span>
                </div>
            );
        },
    },
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
