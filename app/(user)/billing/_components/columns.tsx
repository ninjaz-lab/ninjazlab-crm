"use client";

import {useState} from "react";
import {toast} from "sonner";
import {ColumnDef} from "@tanstack/react-table";
import {TableRowAction, TableRowActions} from "@/components/data-table/table-row-actions";
import {DocumentPreviewDialog} from "@/components/document-preview-dialog";
import {HugeIcon} from "@/components/huge-icon";
import {Badge} from "@/components/ui/badge";
import {generateDateColumn} from "@/lib/utils/date";
import {TRANSACTION_STATUS, TRANSACTION_TYPES} from "@/lib/enums";
import {fetchAmountColor, formatAmount} from "@/lib/utils/amount";
import {cn} from "@/lib/utils/utils";

const ActionsCell = ({row, viewType}: { row: any; viewType: string }) => {
    const [previewDoc, setPreviewDoc] = useState<{ title: string, url: string } | null>(null);

    // Transactions tab shows receipt. Invoice tab completely hides it.
    const showReceiptAction = !!row.original.receiptUrl && viewType === "transactions";
    const showInvoiceAction = !!row.original.invoiceUrl;

    if (!showReceiptAction && !showInvoiceAction) return null;

    const actions: TableRowAction[] = [
        {
            label: "View Receipt",
            icon: "Attachment01Icon",
            onClick: () => setPreviewDoc({title: "Receipt Document", url: row.original.receiptUrl}),
            hidden: !showReceiptAction,
            variant: "default",
        },
        {
            label: "View Invoice",
            icon: "Invoice01Icon",
            onClick: () => setPreviewDoc({title: "Invoice Document", url: row.original.invoiceUrl}),
            hidden: !showInvoiceAction,
            variant: "success",
        }
    ];

    return (
        <>
            <TableRowActions actions={actions}/>
            <DocumentPreviewDialog open={!!previewDoc}
                                   onOpenChange={(open) => !open && setPreviewDoc(null)}
                                   title={previewDoc?.title || ""}
                                   url={previewDoc?.url}
            />
        </>
    );
};

export const getColumns = (
    viewType: "transactions" | "invoices" = "transactions"
): ColumnDef<any>[] => [
    {
        id: "index",
        header: () => <div className="font-bold uppercase text-[10px] tracking-widest text-center w-8">#</div>,
        cell: ({row}) => <div className="text-xs font-bold text-muted-foreground text-center w-8">{row.index + 1}</div>,
        size: 40,
    },
    {
        accessorKey: "description",
        header: () => <div className="font-bold uppercase text-[10px] tracking-widest">Transaction Details</div>,
        cell: ({row}) => {
            const isInvoiceView = viewType === "invoices";
            const txId = row.original.transactionId;
            const invoiceNum = row.original.invoiceNumber;

            return (
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-2 rounded-lg border shadow-sm shrink-0",
                        row.original.type === TRANSACTION_TYPES.CREDIT
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                    )}>
                        <HugeIcon
                            name={row.original.type === TRANSACTION_TYPES.CREDIT ? "ArrowDownLeft01Icon" : "ArrowUpRight01Icon"}
                            size={16}
                        />
                    </div>

                    {!isInvoiceView && (
                        <div className="flex flex-col">
                            <span className="font-bold text-sm tracking-tight">{row.original.description}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-mono font-bold text-muted-foreground">
                                    {txId}
                                </span>
                                <button onClick={() => {
                                    navigator.clipboard.writeText(txId);
                                    toast.success("Transaction ID copied!");
                                }} className="text-muted-foreground hover:text-primary transition-colors outline-none"
                                        title="Copy TRN ID">
                                    <HugeIcon name="Copy01Icon" size={10}/>
                                </button>
                            </div>
                        </div>
                    )}

                    {isInvoiceView && (
                        <div className="flex flex-col">
                            {/* Big Text: Invoice Name */}
                            <span className="font-bold text-sm tracking-tight">{invoiceNum || "Invoice"}</span>

                            {/* Small Text: TRN-ID + Copy Button */}
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-mono font-bold text-muted-foreground">
                                    {txId}
                                </span>
                                <button onClick={() => {
                                    navigator.clipboard.writeText(txId);
                                    toast.success("Transaction ID copied!");
                                }} className="text-muted-foreground hover:text-primary transition-colors outline-none"
                                        title="Copy TRN ID">
                                    <HugeIcon name="Copy01Icon" size={10}/>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            );
        },
    },
    generateDateColumn("date", "Transaction Date Time"),
    {
        accessorKey: "status",
        size: 80,
        header: () => <div className="font-bold uppercase text-[10px] tracking-widest text-center">Status</div>,
        cell: ({row}) => {
            const status = row.original.status || TRANSACTION_STATUS.PENDING;
            return (
                <div className="flex justify-center">
                    <Badge variant="secondary" className={cn(
                        "w-[75px] justify-center text-[9px] uppercase font-black tracking-widest px-0 py-0.5 border shadow-none",
                        status === TRANSACTION_STATUS.APPROVED ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-amber-600 border-amber-200 bg-amber-50",
                        status === TRANSACTION_STATUS.REJECTED && "text-rose-600 border-rose-200 bg-rose-50"
                    )}>
                        {status}
                    </Badge>
                </div>
            );
        },
    },
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
                </div>
            );
        },
    },
    {
        accessorKey: "runningBalance",
        header: () => <div className="text-right font-bold uppercase text-[10px] tracking-widest">Balance</div>,
        cell: ({row}) => {
            const balance = parseFloat(row.original.balanceAfter || "0");
            return (
                <div className="flex items-center justify-end gap-1.5">
                    <span className="font-mono text-sm font-bold text-foreground">
                        {formatAmount(balance)}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground">MYR</span>
                </div>
            );
        },
    },
    {
        id: "actions",
        size: 40,
        cell: ({row}) =>
            <ActionsCell row={row}
                         viewType={viewType}/>
    }
];