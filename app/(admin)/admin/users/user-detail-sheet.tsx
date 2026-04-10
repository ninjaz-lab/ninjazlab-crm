"use client";

import {useCallback, useEffect, useState} from "react";
import {adjustBalance, fetchUserFullDetails, fetchUserTransactions} from "@/lib/actions/admin";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {
    ArrowDownLeft,
    ArrowUpRight,
    ChevronLeft,
    ChevronRight,
    Loader2,
    MinusCircle,
    PlusCircle,
    Wallet
} from "lucide-react";
import {format} from "date-fns";
import {cn} from "@/lib/utils";
import {toast} from "sonner";
import {Badge} from "@/components/ui/badge";

export function UserDetailSheet({userId, open, onOpenChangeAction}: {
    userId: string | null; open: boolean; onOpenChangeAction: (open: boolean) => void;
}) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const [transactions, setTransactions] = useState<any[]>([]);
    const [totalTx, setTotalTx] = useState(0);
    const [txPage, setTxPage] = useState(1);
    const [pageSize, setPageSize] = useState("10");
    const [txLoading, setTxLoading] = useState(false);

    const [adjustAmt, setAdjustAmt] = useState("");
    const [adjustNote, setAdjustNote] = useState("");
    const [isAdjusting, setIsAdjusting] = useState(false);

    const loadProfile = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const res = await fetchUserFullDetails(userId);
            setData(res);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const loadTx = useCallback(async () => {
        if (!userId) return;
        setTxLoading(true);
        try {
            const res = await fetchUserTransactions(userId, txPage, parseInt(pageSize));
            setTransactions(res.transactions);
            setTotalTx(res.total);
        } finally {
            setTxLoading(false);
        }
    }, [userId, txPage, pageSize]);

    useEffect(() => {
        if (open && userId) {
            void loadProfile();
            void loadTx();
        }
    }, [open, userId, loadProfile, loadTx]);

    async function handleAdjust(type: "CREDIT" | "DEBIT") {
        const amt = parseFloat(adjustAmt);
        if (isNaN(amt) || amt <= 0) return toast.error("Invalid amount");
        setIsAdjusting(true);
        try {
            await adjustBalance(userId!, amt, type, adjustNote);
            toast.success(`${type} successful`);
            setAdjustAmt("");
            setAdjustNote("");
            void loadProfile();
            void loadTx();
        } finally {
            setIsAdjusting(false);
        }
    }

    if (!userId) return null;

    const balance = parseFloat(data?.profile?.wallets?.balance ?? "0");
    const totalPages = Math.max(1, Math.ceil(totalTx / parseInt(pageSize)));

    return (
        <Sheet open={open} onOpenChange={onOpenChangeAction}>
            <SheetContent className="sm:max-w-xl w-full flex flex-col p-0 shadow-2xl h-full overflow-hidden">
                <SheetHeader className="p-6 border-b bg-muted/5 shrink-0">
                    <div className="flex justify-between items-start pr-6">
                        <div className="space-y-1">
                            <SheetTitle className="text-2xl font-black tracking-tighter">
                                {loading ? "Syncing..." : (data?.profile?.user?.name || "User Account")}
                            </SheetTitle>
                            <SheetDescription className="font-medium text-xs">
                                {data?.profile?.user?.email}
                            </SheetDescription>
                        </div>
                        {!loading && data && (
                            <div className="text-right">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Balance</p>
                                <p className={cn("text-2xl font-mono font-black", balance < 0 ? "text-rose-600" : "text-emerald-600")}>
                                    MYR {balance.toFixed(2)}
                                </p>
                            </div>
                        )}
                    </div>
                </SheetHeader>

                <Tabs defaultValue="billing" className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="px-6 pt-4 shrink-0">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="billing">Billing</TabsTrigger>
                            <TabsTrigger value="marketing">Events</TabsTrigger>
                            <TabsTrigger value="profile">Profile</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent
                        value="billing"
                        className="flex-1 flex flex-col gap-4 mt-4 min-h-0 overflow-hidden px-6 data-[state=active]:flex"
                    >
                        <div className="p-4 rounded-xl border bg-muted/20 space-y-4 shrink-0">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Wallet className="size-3"/> Quick Adjustment
                                </h4>
                                <Badge variant="outline" className="text-[10px] font-bold bg-background">MYR</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Input placeholder="0.00" type="number" value={adjustAmt}
                                       onChange={(e) => setAdjustAmt(e.target.value)}
                                       className="bg-background h-9 text-xs"/>
                                <Input placeholder="Note..." value={adjustNote}
                                       onChange={(e) => setAdjustNote(e.target.value)}
                                       className="bg-background h-9 text-xs"/>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Button size="sm" onClick={() => handleAdjust("CREDIT")}
                                        disabled={isAdjusting || !adjustAmt}
                                        className="bg-emerald-600 hover:bg-emerald-700 font-bold">
                                    <PlusCircle className="mr-2 size-3"/> Credit
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleAdjust("DEBIT")}
                                        disabled={isAdjusting || !adjustAmt} className="font-bold">
                                    <MinusCircle className="mr-2 size-3"/> Debit
                                </Button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center shrink-0">
                            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Audit
                                Trail</h4>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold">Show:</span>
                                <Select value={pageSize} onValueChange={(v) => {
                                    setPageSize(v);
                                    setTxPage(1);
                                }}>
                                    <SelectTrigger
                                        className="h-7 w-16 text-[10px] font-bold"><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* 🚩 NATIVE SCROLL: Replaced <ScrollArea> with a native div */}
                        <div className="flex-1 overflow-y-auto min-h-0 pr-2 border rounded-xl bg-muted/5">
                            <div className="p-3 space-y-2">
                                {txLoading ? (
                                    <div className="py-20 flex justify-center"><Loader2
                                        className="animate-spin opacity-20"/></div>
                                ) : (
                                    transactions.map((tx) => (
                                        <div key={tx.id}
                                             className="flex justify-between items-center p-3 rounded-lg border bg-background group hover:border-muted-foreground/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={cn("p-1.5 rounded-full", tx.type === 'debit' ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600")}>
                                                    {tx.type === 'debit' ? <ArrowDownLeft className="size-3.5"/> :
                                                        <ArrowUpRight className="size-3.5"/>}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold leading-none mb-1 text-card-foreground">{tx.note || tx.module}</p>
                                                    <p className="text-[9px] text-muted-foreground font-mono">
                                                        {format(new Date(tx.createdAt), "MMM d, HH:mm:ss")}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className={cn("text-xs font-mono font-black", tx.type === 'debit' ? "text-rose-600" : "text-emerald-600")}>
                                                {tx.type === 'debit' ? '-' : '+'} {parseFloat(tx.amount).toFixed(2)}
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
                                <Button variant="outline" size="icon" className="size-8" disabled={txPage <= 1}
                                        onClick={() => setTxPage(p => p - 1)}>
                                    <ChevronLeft className="size-4"/>
                                </Button>
                                <Button variant="outline" size="icon" className="size-8" disabled={txPage >= totalPages}
                                        onClick={() => setTxPage(p => p + 1)}>
                                    <ChevronRight className="size-4"/>
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="marketing" className="flex-1 min-h-0 px-6 data-[state=active]:flex flex-col">
                        <div className="flex-1 overflow-y-auto min-h-0 py-4">
                            <p className="text-center text-xs text-muted-foreground">Marketing history coming
                                soon...</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="profile" className="flex-1 min-h-0 px-6 data-[state=active]:flex flex-col">
                        <div className="flex-1 overflow-y-auto min-h-0 py-4">
                            <p className="text-center text-xs text-muted-foreground">Profile data coming soon...</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}