"use client";

import {format} from "date-fns";
import {cn} from "@/lib/utils/utils";
import {formatAmount} from "@/lib/utils/transactions";
import {Button} from "@/components/ui/button";
import {HugeIcon} from "@/components/huge-icon";
import {Input} from "@/components/ui/input";
import {ColumnDef} from "@tanstack/react-table";
import {DataTable} from "@/components/data-table/data-table";

interface Props {
    adjustAmt: string;
    setAdjustAmt: (val: string) => void;
    adjustNote: string;
    setAdjustNote: (val: string) => void;
    isAdjusting: boolean;
    onAdjust: (type: "CREDIT" | "DEBIT") => void;
    pageSize: string;
    setPageSize: (val: string) => void;
    setTxPage: (val: number | ((prev: number) => number)) => void;
    txLoading: boolean;
    transactions: any[];
    txPage: number;
    totalTx: number;
}

const txColumns: ColumnDef<any>[] = [
    {
        id: "index",
        header: () => <div className="text-center font-bold uppercase text-[10px] tracking-widest">#</div>,
        cell: ({row, table}) => {
            const visualIndex = table.getRowModel().rows.findIndex((r) => r.id === row.id);
            const {pageIndex, pageSize} = table.getState().pagination;
            return (
                <div className="text-center font-mono text-xs text-muted-foreground">
                    {pageIndex * pageSize + visualIndex + 1}
                </div>
            );
        },
    },
    {
        id: "description",
        header: () => <span className="text-[10px] font-black uppercase tracking-widest">Description</span>,
        cell: ({row}) => {
            const tx = row.original;
            return (
                <div className="flex items-center gap-2.5">
                    <div className={cn(
                        "size-7 rounded-lg flex items-center justify-center shrink-0",
                        tx.type === "debit" ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"
                    )}>
                        <HugeIcon
                            name={tx.type === "debit" ? "ArrowDownLeft01Icon" : "ArrowUpRight01Icon"}
                            size={13}
                        />
                    </div>
                    <div>
                        <p className="text-xs font-bold leading-none">{tx.note || tx.module || "—"}</p>
                        <p className="text-[9px] text-muted-foreground font-mono mt-0.5">
                            {format(new Date(tx.createdAt), "MMM d, yyyy · HH:mm:ss")}
                        </p>
                    </div>
                </div>
            );
        },
    },
    {
        id: "amount",
        header: () => <div className="text-right text-[10px] font-black uppercase tracking-widest">Amount</div>,
        cell: ({row}) => {
            const tx = row.original;
            return (
                <div className="text-right">
                    <p className={cn("text-xs font-mono font-black tabular-nums",
                        tx.type === "debit" ? "text-rose-500" : "text-emerald-600"
                    )}>
                        {tx.type === "debit" ? "−" : "+"}{formatAmount(tx.amount)}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-bold">MYR</p>
                </div>
            );
        },
    },
];

export function UserTabWallet({
                                  adjustAmt, setAdjustAmt,
                                  adjustNote, setAdjustNote,
                                  isAdjusting, onAdjust,
                                  pageSize, setPageSize,
                                  setTxPage, txLoading, transactions,
                                  txPage, totalTx,
                              }: Props) {
    return (
        <>
            {/* Quick Adjustment */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden shrink-0">
                <div className="px-4 py-2.5 border-b bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <HugeIcon name="Wallet01Icon" size={11} className="text-muted-foreground"/>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quick
                            Adjustment</h4>
                    </div>
                    <span
                        className="text-[9px] font-black text-muted-foreground uppercase tracking-wider bg-muted px-2 py-0.5 rounded">MYR</span>
                </div>
                <div className="p-4 space-y-3">
                    <div className="grid grid-cols-5 gap-2">
                        <Input
                            placeholder="0.00"
                            type="number"
                            value={adjustAmt}
                            onChange={(e) => setAdjustAmt(e.target.value)}
                            className="col-span-2 h-9 text-xs font-mono font-bold bg-muted/30 border-muted-foreground/10"
                        />
                        <Input
                            placeholder="Add a note..."
                            value={adjustNote}
                            onChange={(e) => setAdjustNote(e.target.value)}
                            className="col-span-3 h-9 text-xs bg-muted/30 border-muted-foreground/10"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            size="sm"
                            onClick={() => onAdjust("CREDIT")}
                            disabled={isAdjusting || !adjustAmt}
                            className="h-9 text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <HugeIcon name="AddCircleIcon" size={14}/> Credit
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => onAdjust("DEBIT")}
                            disabled={isAdjusting || !adjustAmt}
                            className="h-9 text-xs font-bold gap-2 bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            <HugeIcon name="RemoveCircleIcon" size={14}/> Debit
                        </Button>
                    </div>
                </div>
            </div>

            {/* Transaction DataTable */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 pb-2 custom-scrollbar">
                {txLoading ? (
                    <div className="py-20 flex justify-center">
                        <HugeIcon name="Loading02Icon" size={24} className="animate-spin text-muted-foreground"/>
                    </div>
                ) : (
                    <DataTable
                        columns={txColumns}
                        data={transactions}
                        hideSearch
                        isServerSide
                        totalRows={totalTx}
                        currentPage={txPage}
                        pageSize={parseInt(pageSize)}
                        onPageChange={(page) => setTxPage(page)}
                        onPageSizeChange={(size) => {
                            setPageSize(String(size));
                            setTxPage(1);
                        }}
                    />
                )}
            </div>
        </>
    );
}
