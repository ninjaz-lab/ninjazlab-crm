import {ColumnDef} from "@tanstack/react-table";
import {cn} from "@/lib/utils/utils";
import {HugeIcon} from "@/components/huge-icon";
import {format} from "date-fns";
import {fetchAmountArrow, fetchAmountColor, fetchAmountSign, formatAmount} from "@/lib/utils/amount";

export const getColumns: ColumnDef<any>[] = [
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
                        fetchAmountColor(tx.type)
                    )}>
                        <HugeIcon name={fetchAmountArrow(tx.type)}
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
                    <p className={cn("text-xs font-mono font-black tabular-nums flex items-baseline justify-end gap-1",
                        fetchAmountColor(tx.type)
                    )}>
                        <span className="text-[9px] text-muted-foreground font-bold">MYR</span>
                        {fetchAmountSign(tx.type)}
                        {formatAmount(tx.amount)}
                    </p>
                </div>
            );
        },
    },
    {
        id: "balance",
        header: () => <div className="text-right text-[10px] font-black uppercase tracking-widest pr-2">Balance</div>,
        cell: ({row}) => {
            const tx = row.original;
            const balance = tx.balanceAfter;

            if (balance === undefined || balance === null)
                return (
                    <div className="text-right">
                        <p className="font-mono text-xs font-bold text-muted-foreground">—</p>
                    </div>
                );

            return (
                <div className="text-right">
                    <p className="font-mono text-xs font-black text-foreground tabular-nums">
                        <span className="text-[9px] text-muted-foreground font-bold">MYR</span>
                        {formatAmount(balance)}
                    </p>
                </div>
            );
        }
    },
];