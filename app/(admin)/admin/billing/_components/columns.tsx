"use client";

import {ColumnDef} from "@tanstack/react-table";
import {Badge} from "@/components/ui/badge";
import {cn} from "@/lib/utils/utils";
import {fetchAmountColor, formatAmount} from "@/lib/utils/transactions";
import {formatDate, formatTime} from "@/lib/utils/date";
import {HugeIcon} from "@/components/huge-icon";
import {Dialog, DialogContent, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {TRANSACTION_STATUS, TRANSACTION_TYPES} from "@/lib/enums";
import {useTransition} from "react";
import {approveTopUp, rejectTopUp} from "@/lib/actions/admin/billing";
import {toast} from "sonner";
import {DataTableActions} from "@/components/data-table-actions";

const ActionCell = ({row}: { row: any }) => {
    const tx = row.original;
    const [isPending, startTransition] = useTransition();

    // Hide the entire dropdown if it's already processed
    if (tx.status !== TRANSACTION_STATUS.PENDING) return null;

    const handleAction = (action: "approve" | "reject") => {
        startTransition(async () => {
            try {
                if (action === "approve") {
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

    return (
        <DataTableActions
            actions={[
                {
                    label: "Approve",
                    icon: "CheckmarkCircle01Icon",
                    variant: "success",
                    onClick: () => handleAction("approve"),
                    disabled: isPending
                },
                {
                    label: "Reject",
                    icon: "CancelCircleIcon",
                    variant: "destructive",
                    onClick: () => handleAction("reject"),
                    disabled: isPending,
                    hidden: tx.status !== TRANSACTION_STATUS.PENDING
                }
            ]}
        />
    );
};

export const getColumns = (): ColumnDef<any>[] => [
    {
        id: "index",
        header: () => <div className="font-bold uppercase text-[10px] tracking-widest text-center w-8">#</div>,
        cell: ({row}) => <div className="text-xs font-bold text-muted-foreground text-center w-8">{row.index + 1}</div>,
        size: 40,
    },
    {
        accessorKey: "date",
        header: "Date",
        cell: ({row}) => {
            const dateVal = row.getValue("date") as string;
            return (
                <div className="flex flex-col tracking-tighter">
                    <span className="text-xs font-bold text-foreground">{formatDate(dateVal)}</span>
                    <span
                        className="text-[10px] font-medium text-muted-foreground uppercase">{formatTime(dateVal)}</span>
                </div>
            );
        },
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
                {row.original.receiptUrl && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <button
                                className="text-[10px] text-primary font-bold hover:underline flex items-center mt-0.5 outline-none text-left">
                                <HugeIcon name="Attachment01Icon" size={10} className="mr-1"/> View Receipt
                            </button>
                        </DialogTrigger>
                        <DialogContent
                            className="sm:max-w-4xl w-full h-[80vh] min-h-[80vh] p-0 overflow-hidden bg-background border-none rounded-xl flex flex-col">
                            <DialogTitle className="sr-only">Receipt Document</DialogTitle>
                            <div className="flex-1 w-full h-full bg-muted/10">
                                <iframe src={row.original.receiptUrl} className="w-full h-full border-0"
                                        title="Receipt Document"/>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        ),
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
        id: "actions",
        cell: ActionCell
    }
];