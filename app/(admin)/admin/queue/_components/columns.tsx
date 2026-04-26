"use client";

import {useState} from "react";
import {ColumnDef} from "@tanstack/react-table";
import {Badge} from "@/components/ui/badge";
import {HugeIcon} from "@/components/huge-icon";
import {generateDateColumn} from "@/lib/utils/date";
import {TableRowActions} from "@/components/data-table/table-row-actions";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle} from "@/components/ui/sheet";

function ActionCell({row}: { row: any }) {
    const [open, setOpen] = useState(false);
    const job = row.original;

    const actions = [
        {
            label: "View",
            icon: "ViewIcon",
            variant: "destructive" as const,
            hidden: !job.failedReason,
            onClick: () => setOpen(true),
        },
    ];

    return (
        <>
            <div className="flex justify-end">
                <TableRowActions actions={actions}/>
            </div>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent className="sm:max-w-xl flex flex-col gap-6">
                    <SheetHeader className="space-y-1">
                        <div className="flex items-center gap-2 text-destructive">
                            <HugeIcon name="Alert01Icon" size={20}/>
                            <SheetTitle className="text-xl">Job Failure Details</SheetTitle>
                        </div>
                        <SheetDescription className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
                            Technical stack trace for Job ID: {job.id}
                        </SheetDescription>
                        <p className="text-sm text-muted-foreground font-mono">ID: {job.id}</p>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto space-y-4">
                        <div
                            className="p-4 rounded-xl bg-destructive/5 border border-destructive/10 text-destructive text-sm font-mono whitespace-pre-wrap leading-relaxed">
                            {job.failedReason || "No error message provided."}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-lg border bg-muted/30">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Attempts</p>
                                <p className="text-sm font-semibold">{job.attemptsMade}</p>
                            </div>
                            <div className="p-3 rounded-lg border bg-muted/30">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Status</p>
                                <p className="text-sm font-semibold capitalize">{job.status}</p>
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}

export const getColumns = (): ColumnDef<any>[] => [
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
        accessorKey: "id",
        header: () => <div className="text-center font-bold uppercase text-[10px] tracking-widest w-[60px]">
            Job ID</div>,
        cell: ({row}) => <span className="font-mono text-xs text-muted-foreground">{row.original.id}</span>,
    },
    {
        accessorKey: "campaignId",
        header: () => <div
            className="text-center font-bold uppercase text-[10px] tracking-widest w-[60px]">Campaign</div>,
        cell: ({row}) => <span
            className="font-mono text-xs font-semibold">{row.original.campaignId}...</span>,
    },
    {
        accessorKey: "status",
        header: () => <div className="text-center font-bold uppercase text-[10px] tracking-widest w-[60px]">
            Status
        </div>,
        cell: ({row}) => {
            const status = row.original.status;

            const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
                active: "default",
                waiting: "secondary",
                delayed: "outline",
                failed: "destructive",
                completed: "outline",
            };

            return (
                <Badge variant={variants[status] || "outline"}
                       className="text-[10px] uppercase font-bold tracking-tight">
                    {status === "active" && <HugeIcon name="Loading01Icon" size={12} className="mr-1 animate-spin"/>}
                    {status === "failed" && <HugeIcon name="Alert01Icon" size={12} className="mr-1"/>}
                    {status}
                </Badge>
            );
        },
    },
    generateDateColumn("timestamp", "Added To Queue"),
    {
        id: "actions",
        header: () => <div className="w-[100px]"/>,
        cell: ({row}) => <ActionCell row={row}/>,
    }
];