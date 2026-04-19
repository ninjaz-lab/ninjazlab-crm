"use client";

import {useState} from "react";
import {ColumnDef} from "@tanstack/react-table";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {cn} from "@/lib/utils/utils";
import {fetchAmountColor, formatAmount} from "@/lib/utils/transactions";
import {HugeIcon} from "@/components/huge-icon";
import {Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {TRANSACTION_STATUS, TRANSACTION_TYPES} from "@/lib/enums";
import {formatDate, formatTime} from "@/lib/utils/date";
import {toast} from "sonner";

const ActionsCell = ({row, viewType}: { row: any; viewType: string }) => {
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

    // Transactions tab shows receipt. Invoice tab completely hides it.
    const showReceiptAction = !!row.original.receiptUrl && viewType === "transactions";
    const showInvoiceAction = !!row.original.invoiceUrl;

    if (!showReceiptAction && !showInvoiceAction) return null;

    const isImage = (url: string) => {
        if (!url) return false;
        return /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
    };

    const receiptIsImage = isImage(row.original.receiptUrl);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted/50">
                        <span className="sr-only">Open menu</span>
                        <HugeIcon name="MoreHorizontalIcon" size={16}/>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="text-xs tracking-widest uppercase font-bold text-muted-foreground">
                        Actions
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator/>

                    {/* Only renders on Transactions Tab */}
                    {showReceiptAction && (
                        <DropdownMenuItem onClick={() => setIsReceiptOpen(true)}
                                          className="cursor-pointer font-medium text-xs">
                            <HugeIcon name="Attachment01Icon" size={14} className="mr-2 text-primary"/> View Receipt
                        </DropdownMenuItem>
                    )}

                    {/* Renders on both tabs (if invoice exists) */}
                    {showInvoiceAction && (
                        <DropdownMenuItem onClick={() => setIsInvoiceOpen(true)}
                                          className="cursor-pointer font-medium text-xs">
                            <HugeIcon name="Invoice01Icon" size={14} className="mr-2 text-emerald-600"/> View Invoice
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Receipt Dialog */}
            <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
                <DialogContent className="sm:max-w-5xl w-[95vw] p-0 overflow-hidden bg-background">
                    <DialogTitle className="sr-only">Receipt Document</DialogTitle>
                    <div className="w-full h-[85vh] flex items-center justify-center p-4 bg-muted/20">
                        {receiptIsImage ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                                src={row.original.receiptUrl}
                                alt="Receipt"
                                className="max-w-full max-h-full object-contain drop-shadow-xl rounded-md"
                            />
                        ) : (
                            <iframe
                                src={row.original.receiptUrl}
                                className="w-full h-full border-0 rounded-xl bg-white shadow-inner"
                                title="Receipt Document"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Invoice Dialog */}
            <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
                <DialogContent className="sm:max-w-5xl w-[95vw] p-0 overflow-hidden bg-background">
                    <DialogTitle className="sr-only">Invoice Document</DialogTitle>
                    <div className="w-full h-[85vh] p-2 md:p-6 bg-muted/20">
                        <iframe
                            src={row.original.invoiceUrl}
                            className="w-full h-full border-0 rounded-xl bg-white shadow-inner"
                            title="Invoice Document"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export const getColumns = (viewType: "transactions" | "invoices" = "transactions"): ColumnDef<any>[] => [
    {
        id: "index",
        header: () => <div className="font-bold uppercase text-[10px] tracking-widest text-center w-8">#</div>,
        cell: ({row}) => <div className="text-xs font-bold text-muted-foreground text-center w-8">{row.index + 1}</div>,
        size: 40,
    },
    {
        accessorKey: "date",
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
            const dateVal = row.getValue("date") as string;
            return (
                <div className="flex flex-col tracking-tighter">
                    <span className="text-xs font-bold text-foreground">{formatDate(dateVal)}</span>
                    <span className="text-[10px] font-medium text-muted-foreground">{formatTime(dateVal)}</span>
                </div>
            );
        },
    },
    {
        accessorKey: "description",
        header: () => <div className="font-bold uppercase text-[10px] tracking-widest">Transaction Details</div>,
        cell: ({row}) => {
            const isInvoiceView = viewType === "invoices";
            const txId = row.original.id as string;
            const shortId = txId ? `TRN-${txId.substring(0, 8).toUpperCase()}` : "-";
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
                                    {shortId}
                                </span>
                                <button onClick={() => {
                                    navigator.clipboard.writeText(shortId);
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
                                    {shortId}
                                </span>
                                <button onClick={() => {
                                    navigator.clipboard.writeText(shortId);
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
                        status === TRANSACTION_STATUS.COMPLETED ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-amber-600 border-amber-200 bg-amber-50",
                        status === TRANSACTION_STATUS.FAILED && "text-rose-600 border-rose-200 bg-rose-50"
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
        accessorKey: "balanceAfter",
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
        cell: ({row}) => <ActionsCell row={row} viewType={viewType}/>
    }
];