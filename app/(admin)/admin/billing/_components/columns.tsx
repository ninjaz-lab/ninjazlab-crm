"use client";

import {useState, useTransition} from "react";
import {toast} from "sonner";
import {ColumnDef} from "@tanstack/react-table";
import {TableRowAction, TableRowActions} from "@/components/data-table/table-row-actions";
import {DocumentPreviewDialog} from "@/components/document-preview-dialog";
import {HugeIcon} from "@/components/huge-icon";
import {Badge} from "@/components/ui/badge";
import {approveTopUp, rejectTopUp} from "@/lib/actions/admin/billing";
import {TRANSACTION_STATUS, TRANSACTION_TYPES} from "@/lib/enums";
import {createDateColumn} from "@/lib/utils/date";
import {fetchAmountColor, formatAmount} from "@/lib/utils/transactions";
import {cn} from "@/lib/utils/utils";

export const getColumns = (): ColumnDef<any>[] => [
    {
        id: "index",
        header: () => <div className="font-bold uppercase text-[10px] tracking-widest text-center w-8">#</div>,
        cell: ({row, table}) => {
            const sortedIndex = table.getSortedRowModel().flatRows.findIndex(
                (r) => r.original.id === row.original.id
            );
            return <div className="text-xs font-bold text-muted-foreground text-center w-8">{sortedIndex + 1}</div>;
        },
        size: 40,
    },
    {
        id: "user",
        header: () => <div className="font-bold uppercase text-[10px] tracking-widest">User</div>,
        cell: ({row}) => (
            <div className="flex flex-col">
                <span className="text-xs font-bold">{row.original.userName || "Unknown User"}</span>
                <span className="text-[10px] text-muted-foreground">{row.original.userEmail}</span>
            </div>
        ),
    },
    {
        accessorKey: "description",
        header: () => <div className="font-bold uppercase text-[10px] tracking-widest">Details</div>,
        cell: ({row}) => (
            <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight">{row.original.description}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-mono font-bold text-muted-foreground">
                        {row.original.transactionId || "N/A"}
                    </span>
                    {row.original.transactionId && (
                        <button onClick={() => {
                            navigator.clipboard.writeText(row.original.transactionId);
                            toast.success("Transaction ID copied!");
                        }} className="text-muted-foreground hover:text-primary transition-colors outline-none"
                                title="Copy TRN ID">
                            <HugeIcon name="Copy01Icon" size={10}/>
                        </button>
                    )}
                </div>
            </div>
        ),
    },
    createDateColumn("date", "Processed Date"),
    {
        accessorKey: "amount",
        header: () => <div className="text-right font-bold uppercase text-[10px] tracking-widest">Amount</div>,
        cell: ({row}) => {
            const isCredit = row.original.type === TRANSACTION_TYPES.CREDIT;
            const amount = Math.abs(parseFloat(row.original.amount));
            const colorClass = fetchAmountColor(row.original.type);
            return (
                <div className="flex items-center justify-end gap-1.5">
            <span className={cn("font-mono text-sm font-black", colorClass)}>
        {isCredit ? "+" : "-"}{formatAmount(amount)}
        </span>
                    <span className="text-[10px] font-bold text-muted-foreground">MYR</span>
                </div>
            );
        },
    },
    {
        accessorKey: "status",
        size: 80,
        header: () => <div className="font-bold uppercase text-[10px] tracking-widest text-center">Status</div>,
        cell: ({row}) => {
            const status = row.original.status || TRANSACTION_STATUS.PENDING;
            return (
                <div className="flex justify-center">
                    <Badge variant="secondary"
                           className={cn(
                               "w-[75px] justify-center text-[9px] uppercase font-black tracking-widest px-0 py-0.5 border shadow-none",
                               status === TRANSACTION_STATUS.APPROVED
                                   ? "text-emerald-600 border-emerald-200 bg-emerald-50"
                                   : "text-amber-600 border-amber-200 bg-amber-50",
                               status === TRANSACTION_STATUS.REJECTED && "text-rose-600 border-rose-200 bg-rose-50"
                           )}>
                        {status}
                    </Badge>
                </div>
            );
        },
    },
    {
        id: "receipt",
        header: () => <div className="font-bold uppercase text-[10px] tracking-widest text-center">Receipt</div>,
        cell: function ReceiptCell({row}) {
            const [previewDoc, setPreviewDoc] = useState<{ title: string, url: string } | null>(null);
            const hasReceipt = !!row.original.receiptUrl;

            if (!hasReceipt)
                return <span
                    className="text-muted-foreground text-[10px] uppercase font-bold text-center block">-</span>;

            return (
                <>
                    <button onClick={() => setPreviewDoc({title: "Receipt Document", url: row.original.receiptUrl})}
                            className="text-[10px] font-bold text-primary hover:underline uppercase flex items-center gap-1 mx-auto outline-none"
                    >
                        <HugeIcon name="Attachment01Icon" size={12}/> View
                    </button>

                    {previewDoc && (
                        <DocumentPreviewDialog open={true}
                                               onOpenChange={(open) => !open && setPreviewDoc(null)}
                                               title={previewDoc.title}
                                               url={previewDoc.url}
                        />
                    )}
                </>
            );
        }
    },
    {
        id: "actions",
        cell: function ActionCell({row}) {
            const tx = row.original;
            const [isPending, startTransition] = useTransition();

            const handleAction = (action: typeof TRANSACTION_STATUS.APPROVED | typeof TRANSACTION_STATUS.REJECTED) => {
                startTransition(async () => {
                    try {
                        if (action === TRANSACTION_STATUS.APPROVED) {
                            await approveTopUp(tx.id);
                            toast.success("Top-up approved and wallet credited.");
                        } else {
                            await rejectTopUp(tx.id);
                            toast.info("Top-up rejected.");
                        }
                    } catch (error: any) {
                        toast.error(error.message || "Something went wrong.");
                    }
                });
            };

            const isPendingStatus = tx.status === TRANSACTION_STATUS.PENDING;
            if (!isPendingStatus) return null;

            const actions: TableRowAction[] = [
                {
                    label: "Approve",
                    icon: "CheckmarkCircle01Icon",
                    variant: "success",
                    onClick: () => handleAction(TRANSACTION_STATUS.APPROVED),
                    disabled: isPending,
                    hidden: !isPendingStatus
                },
                {
                    label: "Reject",
                    icon: "CancelCircleIcon",
                    variant: "destructive",
                    onClick: () => handleAction(TRANSACTION_STATUS.REJECTED),
                    disabled: isPending,
                    hidden: !isPendingStatus
                }
            ];

            return <TableRowActions actions={actions}/>
        }
    }
];
