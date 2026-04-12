"use client";

import {format} from "date-fns";
import {cn} from "@/lib/utils/utils";
import {formatAmount} from "@/lib/utils/transactions";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {HugeIcon} from "@/components/huge-icon";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

interface UserWalletTabProps {
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
    totalPages: number;
}

export function UserWalletTab({
                                  adjustAmt, setAdjustAmt,
                                  adjustNote, setAdjustNote,
                                  isAdjusting, onAdjust,
                                  pageSize, setPageSize,
                                  setTxPage, txLoading, transactions,
                                  txPage, totalPages
                              }: UserWalletTabProps) {
    return (
        <>
            <div className="p-4 rounded-xl border-2 bg-background shadow-sm space-y-4 shrink-0">
                <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <HugeIcon name="Wallet01Icon" size={12}/> Quick Adjustment
                    </h4>
                    <Badge variant="secondary" className="text-[10px] font-bold">MYR</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="0.00" type="number" value={adjustAmt}
                           onChange={(e) => setAdjustAmt(e.target.value)}
                           className="bg-muted/30 border-none focus-visible:ring-1 h-9 text-xs"/>
                    <Input placeholder="Note..." value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)}
                           className="bg-muted/30 border-none focus-visible:ring-1 h-9 text-xs"/>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" onClick={() => onAdjust("CREDIT")}
                            disabled={isAdjusting || !adjustAmt}
                            className="h-8 text-[11px] font-bold gap-2 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all">
                        <HugeIcon name="AddCircleIcon" size={14}/> Credit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onAdjust("DEBIT")}
                            disabled={isAdjusting || !adjustAmt}
                            className="h-8 text-[11px] font-bold gap-2 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all">
                        <HugeIcon name="RemoveCircleIcon" size={14}/> Debit
                    </Button>
                </div>
            </div>

            <div className="flex justify-between items-center shrink-0">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Wallet
                    Transactions</h4>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground">Show:</span>
                    <Select value={pageSize} onValueChange={(v) => {
                        setPageSize(v);
                        setTxPage(1);
                    }}>
                        <SelectTrigger
                            className="h-7 w-16 text-[10px] font-bold shadow-sm bg-background border"><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-4 custom-scrollbar">
                <div className="space-y-2">
                    {txLoading ? (
                        <div className="py-20 flex justify-center">
                            <HugeIcon name="Loading02Icon"
                                      size={24}
                                      className="animate-spin text-muted-foreground"/>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="py-10 text-center border-2 border-dashed rounded-xl bg-background/50">
                            <p className="text-xs text-muted-foreground font-bold">No transactions found.</p>
                        </div>
                    ) : (
                        transactions.map((tx) => (
                            <div key={tx.id}
                                 className="group flex justify-between items-center p-3 rounded-xl border-2 bg-background hover:border-muted-foreground/20 transition-colors shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={cn("p-2 rounded-lg transition-colors", tx.type === 'debit' ? "bg-rose-50 text-rose-600 group-hover:bg-rose-100" : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100")}>
                                        {tx.type === 'debit'
                                            ? <HugeIcon name="ArrowDownLeft01Icon" size={16}/>
                                            : <HugeIcon name="ArrowUpRight01Icon" size={16}/>}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold leading-none mb-1 text-card-foreground">{tx.note || tx.module}</p>
                                        <p className="text-[9px] text-muted-foreground font-mono">
                                            {format(new Date(tx.createdAt), "MMM d, HH:mm:ss")}
                                        </p>
                                    </div>
                                </div>
                                <p className={cn("text-xs font-mono font-black", tx.type === 'debit' ? "text-rose-600" : "text-emerald-600")}>
                                    {tx.type === 'debit' ? '-' : '+'} {formatAmount(tx.amount)} MYR
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="py-4 border-t flex items-center justify-between shrink-0 bg-background">
                <span
                    className="text-[10px] font-bold text-muted-foreground uppercase">Page {txPage} of {totalPages}</span>
                <div className="flex gap-1">
                    <Button variant="outline" size="icon" className="size-8 shadow-sm" disabled={txPage <= 1}
                            onClick={() => setTxPage(p => p - 1)}>
                        <HugeIcon name="ArrowLeft01Icon" size={16}/>
                    </Button>
                    <Button variant="outline" size="icon" className="size-8 shadow-sm" disabled={txPage >= totalPages}
                            onClick={() => setTxPage(p => p + 1)}>
                        <HugeIcon name="ArrowRight01Icon" size={16}/>
                    </Button>
                </div>
            </div>
        </>
    );
}
