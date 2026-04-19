"use client";

import {useCallback, useEffect, useState} from "react";
import {adjustWalletBalance, fetchWalletTransactions} from "@/lib/actions/admin/wallet";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {
    Activity,
    ArrowDownLeft,
    ArrowUpRight,
    ChevronLeft,
    ChevronRight,
    Loader2,
    MinusCircle,
    PlusCircle,
    ShieldAlert,
    UserCheck,
    Users,
    UserX,
    Wallet
} from "lucide-react";
import {format} from "date-fns";
import {cn} from "@/lib/utils/utils";
import {formatAmount} from "@/lib/utils/transactions";
import {toast} from "sonner";
import {Badge} from "@/components/ui/badge";
import {USER_ROLES} from "@/lib/enums";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {banUser, fetchUserFullDetails, setUserRole, unbanUser} from "@/lib/actions/admin/users";

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
            const res = await fetchWalletTransactions(userId, txPage, parseInt(pageSize));
            setTransactions(res.transactions);
            setTotalTx(res.total);
        } finally {
            setTxLoading(false);
        }
    }, [userId, txPage, pageSize]);

    useEffect(() => {
        if (open && userId) {
            setData(null);
            setTransactions([]);
            setTxPage(1);

            void loadProfile();
            void loadTx();
        }
    }, [open, userId, loadProfile, loadTx]);

    // --- Action Handlers ---

    async function handleAdjust(type: "CREDIT" | "DEBIT") {
        const amt = parseFloat(adjustAmt);
        if (isNaN(amt) || amt <= 0) return toast.error("Invalid amount");
        setIsAdjusting(true);
        try {
            await adjustWalletBalance(userId!, amt, type, adjustNote);
            toast.success(`${type} successful`);
            setAdjustAmt("");
            setAdjustNote("");
            void loadProfile();
            void loadTx();
        } finally {
            setIsAdjusting(false);
        }
    }

    async function handleRoleToggle() {
        if (!data?.profile?.user) return;
        const newRole = data.profile.user.role === USER_ROLES.ADMIN ? USER_ROLES.USER : USER_ROLES.ADMIN;
        try {
            await setUserRole(data.profile.user.id, newRole);
            toast.success(`Role successfully changed to ${newRole}`);
            void loadProfile();
        } catch (error) {
            toast.error("Failed to change user role.");
        }
    }

    async function handleBanToggle() {
        if (!data?.profile?.user) return;
        const isBanned = data.profile.user.banned;
        try {
            if (isBanned) {
                await unbanUser(data.profile.user.id);
                toast.success("User has been unbanned.");
            } else {
                await banUser(data.profile.user.id, "Admin manually banned via panel.");
                toast.success("User has been banned.");
            }
            void loadProfile();
        } catch (error) {
            toast.error("Failed to update ban status.");
        }
    }

    if (!userId)
        return null;

    const balance = parseFloat(data?.profile?.wallets?.balance ?? "0");
    const totalPages = Math.max(1, Math.ceil(totalTx / parseInt(pageSize)));

    const effectivePricing: any[] = [];

    if (data?.defaultPricing) {
        const defaults = data.defaultPricing;
        const overrides = data.pricingRules || [];

        defaults.forEach((def: any) => {
            const override = overrides.find((o: any) => o.module === def.module && o.action === def.action);
            if (override) {
                // User has a custom price for this
                effectivePricing.push({...override, isOverride: true, originalPrice: def.unitPrice});
            } else {
                // User pays the standard price
                effectivePricing.push({...def, isOverride: false});
            }
        });

        // Add any weird custom rules that don't exist in defaults
        overrides.forEach((over: any) => {
            if (!effectivePricing.find((e) => e.module === over.module && e.action === over.action)) {
                effectivePricing.push({...over, isOverride: true});
            }
        });
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChangeAction}>
            <SheetContent className="sm:max-w-xl w-full flex flex-col p-0 shadow-2xl h-full overflow-hidden">

                {loading || !data ? (
                    <>
                        {/* Accessibility requirement: Keep title in DOM, but visually hidden */}
                        <SheetHeader className="sr-only">
                            <SheetTitle>Loading User</SheetTitle>
                            <SheetDescription>Retrieving user data...</SheetDescription>
                        </SheetHeader>
                        <div className="flex-1 flex flex-col items-center justify-center bg-muted/10">
                            <Loader2 className="size-8 animate-spin text-muted-foreground mb-4"/>
                            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground animate-pulse">
                                Syncing Account Data...
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        {/* --- NORMAL SHEET RENDER --- */}
                        <SheetHeader className="p-6 border-b bg-muted/5 shrink-0">
                            <div className="flex justify-between items-start pr-6">
                                <div className="flex items-center gap-4">
                                    <Avatar className="size-12 border shadow-sm">
                                        <AvatarImage src={data.profile.user.image || undefined}/>
                                        <AvatarFallback className="font-bold text-muted-foreground">
                                            {data.profile.user.name?.slice(0, 2).toUpperCase() || "US"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <SheetTitle className="text-2xl font-black tracking-tighter">
                                            {data.profile.user.name || "User Account"}
                                        </SheetTitle>
                                        <SheetDescription className="font-medium text-xs">
                                            {data.profile.user.email}
                                        </SheetDescription>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Balance</p>
                                    <p className={cn("text-2xl font-mono font-black", balance < 0 ? "text-rose-600" : "text-emerald-600")}>
                                        {formatAmount(balance)} MYR
                                    </p>
                                </div>
                            </div>
                        </SheetHeader>

                        <Tabs defaultValue="profile" className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            <div className="px-6 pt-4 shrink-0">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="profile">Profile</TabsTrigger>
                                    <TabsTrigger value="wallet">Wallet</TabsTrigger>
                                    <TabsTrigger value="marketing">Events</TabsTrigger>
                                </TabsList>
                            </div>

                            {/* --- PROFILE TAB --- */}
                            <TabsContent value="profile"
                                         className="flex-1 min-h-0 px-6 data-[state=active]:flex flex-col">
                                <div className="flex-1 overflow-y-auto min-h-0 py-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-3 shrink-0">
                                        <div
                                            className="p-4 border rounded-xl bg-muted/5 flex flex-col justify-center shadow-sm">
                                            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1 flex items-center gap-1.5">
                                                <Users className="size-3"/> Total Audience
                                            </p>
                                            <p className="text-2xl font-black">{data.stats.totalAudience?.toLocaleString() || "0"}</p>
                                        </div>
                                        <div
                                            className="p-4 border rounded-xl bg-muted/5 flex flex-col justify-center shadow-sm">
                                            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1 flex items-center gap-1.5">
                                                <Activity className="size-3"/> Last Login
                                            </p>
                                            <p className="text-sm font-bold text-foreground">
                                                {data.stats.lastLoginAt
                                                    ? format(new Date(data.stats.lastLoginAt), "MMM d, yyyy HH:mm")
                                                    : "Never / Unknown"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-5 rounded-xl border bg-muted/5 space-y-4 shrink-0">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                Marketing Rates
                                            </h4>
                                        </div>
                                        {effectivePricing?.length > 0 ? (
                                            <div className="space-y-2">
                                                {effectivePricing.map((rule: any, idx: number) => (
                                                    <div key={rule.id || idx}
                                                         className="flex justify-between items-center p-2.5 rounded-lg bg-background border shadow-sm">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold uppercase">
                                                                {rule.module} <span
                                                                className="text-muted-foreground font-medium lowercase ml-1">({rule.action})</span>
                                                            </span>
                                                            {rule.isOverride ? (
                                                                <Badge
                                                                    className="text-[8px] h-4 px-1 uppercase bg-emerald-600 hover:bg-emerald-600 tracking-tighter">Custom</Badge>
                                                            ) : (
                                                                <Badge variant="secondary"
                                                                       className="text-[8px] h-4 px-1 uppercase text-muted-foreground tracking-tighter">Standard</Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-right flex items-center gap-2">
                                                            {rule.isOverride && rule.originalPrice && (
                                                                <span
                                                                    className="text-[9px] line-through text-muted-foreground">
                                                                     {formatAmount(rule.originalPrice)} MYR
                                                                </span>
                                                            )}
                                                            <span
                                                                className={cn("text-xs font-mono font-black", rule.isOverride ? "text-emerald-600" : "text-foreground")}>
                                                                    {formatAmount(rule.unitPrice)} MYR
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div
                                                className="py-4 text-center border-2 border-dashed rounded-lg bg-background/50">
                                                <p className="text-xs text-muted-foreground font-bold">
                                                    No system pricing configured.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-5 rounded-xl border bg-muted/20 space-y-4 shrink-0">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            Administrative Controls
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button variant="outline" className="font-bold text-xs shadow-sm"
                                                    onClick={handleRoleToggle}>
                                                <ShieldAlert className="mr-2 size-4"/>
                                                {data.profile.user.role === USER_ROLES.ADMIN ? 'Revoke Admin' : 'Make Admin'}
                                            </Button>

                                            {data.profile.user.banned ? (
                                                <Button variant="outline"
                                                        className="text-emerald-600 font-bold text-xs shadow-sm"
                                                        onClick={handleBanToggle}>
                                                    <UserCheck className="mr-2 size-4"/> Unban User
                                                </Button>
                                            ) : (
                                                <Button variant="destructive" className="font-bold text-xs shadow-sm"
                                                        onClick={handleBanToggle}>
                                                    <UserX className="mr-2 size-4"/> Ban User
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <section className="space-y-3 shrink-0 pb-6">
                                        <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Client
                                            Metadata</h4>
                                        <div className="text-sm font-medium bg-muted/5 p-5 rounded-xl border space-y-4">
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Source</p>
                                                <Badge variant="secondary"
                                                       className="font-bold text-[10px]">{data.profile.audience?.source || "Direct / System"}</Badge>
                                            </div>
                                            <div className="pt-3 border-t border-muted/50">
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Account
                                                    Created</p>
                                                <p className="text-xs font-mono font-bold bg-background inline-flex px-2 py-1 rounded border shadow-sm">
                                                    {data.profile.user.createdAt ? format(new Date(data.profile.user.createdAt), "PPP HH:mm:ss") : "Unknown"}
                                                </p>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </TabsContent>

                            {/* --- WALLET TAB --- */}
                            <TabsContent value="wallet"
                                         className="flex-1 flex flex-col gap-4 mt-4 min-h-0 overflow-hidden px-6 data-[state=active]:flex">
                                <div className="p-4 rounded-xl border bg-muted/20 space-y-4 shrink-0">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Wallet className="size-3"/> Quick Adjustment
                                        </h4>
                                        <Badge variant="outline"
                                               className="text-[10px] font-bold bg-background">MYR</Badge>
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
                                                className="bg-emerald-600 hover:bg-emerald-700 font-bold shadow-sm">
                                            <PlusCircle className="mr-2 size-3"/> Credit
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleAdjust("DEBIT")}
                                                disabled={isAdjusting || !adjustAmt} className="font-bold shadow-sm">
                                            <MinusCircle className="mr-2 size-3"/> Debit
                                        </Button>
                                    </div>
                                </div>

                                {/* Page Siz e*/}
                                <div className="flex justify-between items-center shrink-0">
                                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Wallet
                                        Transactions</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold">Show:</span>
                                        <Select value={pageSize} onValueChange={(v) => {
                                            setPageSize(v);
                                            setTxPage(1);
                                        }}>
                                            <SelectTrigger
                                                className="h-7 w-16 text-[10px] font-bold shadow-sm"><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="10">10</SelectItem>
                                                <SelectItem value="20">20</SelectItem>
                                                <SelectItem value="50">50</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div
                                    className="flex-1 overflow-y-auto min-h-0 pr-2 border rounded-xl bg-muted/5 shadow-inner">
                                    <div className="p-3 space-y-2">
                                        {txLoading ? (
                                            <div className="py-20 flex justify-center"><Loader2
                                                className="animate-spin opacity-20"/></div>
                                        ) : transactions.length === 0 ? (
                                            <div className="py-10 text-center">
                                                <p className="text-xs text-muted-foreground font-bold">No transactions
                                                    found.</p>
                                            </div>
                                        ) : (
                                            transactions.map((tx) => (
                                                <div key={tx.id}
                                                     className="flex justify-between items-center p-3 rounded-lg border bg-background group hover:border-muted-foreground/30 transition-colors shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={cn("p-1.5 rounded-full", tx.type === 'debit' ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600")}>
                                                            {tx.type === 'debit' ?
                                                                <ArrowDownLeft className="size-3.5"/> :
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
                                        <Button variant="outline" size="icon" className="size-8 shadow-sm"
                                                disabled={txPage <= 1} onClick={() => setTxPage(p => p - 1)}>
                                            <ChevronLeft className="size-4"/>
                                        </Button>
                                        <Button variant="outline" size="icon" className="size-8 shadow-sm"
                                                disabled={txPage >= totalPages} onClick={() => setTxPage(p => p + 1)}>
                                            <ChevronRight className="size-4"/>
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* --- MARKETING TAB --- */}
                            <TabsContent value="marketing"
                                         className="flex-1 min-h-0 px-6 data-[state=active]:flex flex-col">
                                <div className="flex-1 overflow-y-auto min-h-0 py-4">
                                    <div className="space-y-3 pb-6">
                                        {data.ongoingCampaigns?.length === 0 ? (
                                            <div className="py-10 text-center space-y-2 opacity-60">
                                                <p className="text-xs text-muted-foreground font-bold">No active
                                                    marketing events.</p>
                                            </div>
                                        ) : data.ongoingCampaigns?.map((cp: any) => (
                                            <div key={cp.id}
                                                 className="p-4 border rounded-xl bg-muted/10 flex justify-between items-center shadow-sm">
                                                <div>
                                                    <p className="text-sm font-bold">{cp.name}</p>
                                                    <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">{cp.channel}</p>
                                                </div>
                                                <Badge variant="secondary"
                                                       className="uppercase font-black text-[10px]">{cp.status}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                        </Tabs>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}