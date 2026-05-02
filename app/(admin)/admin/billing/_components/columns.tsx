"use client";

import {useState, useTransition} from "react";
import {toast} from "sonner";
import {ColumnDef} from "@tanstack/react-table";
import {DocumentPreviewDialog} from "@/components/document-preview-dialog";
import {HugeIcon} from "@/components/huge-icon";
import {RoleAvatar} from "@/components/role-avatar";
import {TransactionStatusBadge} from "@/components/badge/transaction-status-badge";
import {TableRowAction, TableRowActions} from "@/components/data-table/table-row-actions";
import {approveTopUp, rejectTopUp} from "@/lib/actions/admin/billing";
import {TRANSACTION_STATUS, TRANSACTION_TYPES} from "@/lib/enums";
import {fetchAmountColor, formatAmount} from "@/lib/utils/amount";
import {generateDateColumn} from "@/lib/utils/date";
import {cn} from "@/lib/utils/utils";
import {TransactionRecord} from "@/lib/types/admin";

/**
 * Get column definitions for billing/transactions table
 * @returns Column definitions for TanStack React Table
 */
export const getColumns = (): ColumnDef<TransactionRecord>[] => [
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
        header: () => <div className="font-bold uppercase text-[10px] tracking-widest">User Account</div>,
        cell: ({row}) => (
            <div className="flex items-center gap-3">
                <RoleAvatar src={row.original.userImage}
                            name={row.original.userName}
                            role={row.original.userRole}/>
                <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold truncate">{row.original.userName || "Unknown User"}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{row.original.userEmail}</span>
                </div>
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
    generateDateColumn("date", "Processed Date"),
    {
        accessorKey: "amount",
        header: () => <div className="text-right font-bold uppercase text-[10px] tracking-widest">Amount</div>,
        cell: ({row}) => {
            const isCredit = row.original.type === TRANSACTION_TYPES.CREDIT;
            const amount = Math.abs(parseFloat(row.original.amount));
            const colorClass = fetchAmountColor(row.original.type);
            return (
                <div className="flex items-center justify-end gap-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground">MYR</span>
                    <span className={cn("font-mono text-sm font-black", colorClass)}>
                        {formatAmount(amount)}
                    </span>
                </div>
            );
        },
    },
    {
        accessorKey: "status",
        size: 80,
        header: () => <div className="font-bold uppercase text-[10px] tracking-widest text-center">Status</div>,
        cell: ({row}) => <TransactionStatusBadge status={row.original.status}/>,
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
