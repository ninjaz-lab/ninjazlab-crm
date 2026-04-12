"use client";

import {useCallback, useEffect, useState} from "react";
import {adjustWalletBalance, fetchWalletTransactions} from "@/lib/actions/admin/wallet";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {cn} from "@/lib/utils/utils";
import {formatAmount} from "@/lib/utils/transactions";
import {toast} from "sonner";
import {USER_ROLES} from "@/lib/enums";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {banUser, fetchUserFullDetails, setUserRole, unbanUser} from "@/lib/actions/admin/users";
import {HugeIcon} from "@/components/huge-icon";

import {UserProfileTab} from "./user-profile-tab";
import {UserWalletTab} from "./user-wallet-tab";
import {UserMarketingTab} from "./user-marketing-tab";
import {RoleBadge} from "@/components/role-badge";

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

    // 1. Initial Load Effect: Only runs when the sheet opens or the user changes
    useEffect(() => {
        if (open && userId) {
            setData(null);  // Show full sheet loader
            setTransactions([]);  // Clear old wallet data
            setTxPage(1);  // Reset pagination

            void loadProfile();
        }
    }, [open, userId, loadProfile]);

    // 2. Wallet Pagination Effect: Runs when page or size changes
    useEffect(() => {
        if (open && userId) {
            void loadTx();
        }
    }, [open, userId, txPage, pageSize, loadTx]);

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

    if (!userId) return null;

    const balance = parseFloat(data?.profile?.wallets?.balance ?? "0");
    const totalPages = Math.max(1, Math.ceil(totalTx / parseInt(pageSize)));

    const effectivePricing: any[] = [];
    if (data?.defaultPricing) {
        const defaults = data.defaultPricing;
        const overrides = data.pricingRules || [];

        defaults.forEach((def: any) => {
            const override = overrides.find((o: any) => o.module === def.module && o.action === def.action);
            if (override) {
                effectivePricing.push({...override, isOverride: true, originalPrice: def.unitPrice});
            } else {
                effectivePricing.push({...def, isOverride: false});
            }
        });
        overrides.forEach((over: any) => {
            if (!effectivePricing.find((e) => e.module === over.module && e.action === over.action)) {
                effectivePricing.push({...over, isOverride: true});
            }
        });
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChangeAction}>
            <SheetContent
                className="w-full sm:max-w-xl p-0 flex flex-col gap-0 border-l shadow-2xl h-full overflow-hidden">

                {loading || !data ? (
                    <>
                        <SheetHeader className="sr-only">
                            <SheetTitle>Loading User</SheetTitle>
                            <SheetDescription>Retrieving user data...</SheetDescription>
                        </SheetHeader>
                        <div className="flex-1 flex flex-col items-center justify-center bg-muted/10">
                            <HugeIcon name="Loading02Icon"
                                      size={32}
                                      className="animate-spin text-primary opacity-50 mb-4"/>
                            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground animate-pulse">
                                Syncing Account Data...
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <SheetHeader className="p-6 border-b bg-muted/10 relative overflow-hidden shrink-0">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <HugeIcon name="UserIcon" size={120} className="rotate-12"/>
                            </div>
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center justify-between">
                                    <Avatar className="size-12 border-2 border-background shadow-md">
                                        <AvatarImage src={data.profile.user.image || undefined}/>
                                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                            {data.profile.user.name?.slice(0, 2).toUpperCase() || "US"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">
                                                Wallet Balance
                                            </p>
                                            <p className={cn("text-base font-mono font-black leading-none", balance < 0 ? "text-rose-600" : "text-emerald-600")}>
                                                {formatAmount(balance)} MYR
                                            </p>
                                        </div>
                                        <RoleBadge role={data.profile.user.role}/>
                                    </div>
                                </div>
                                <div>
                                    <SheetTitle className="text-2xl font-black tracking-tighter">
                                        {data.profile.user.name || "User Account"}
                                    </SheetTitle>
                                    <SheetDescription className="text-sm font-medium">
                                        {data.profile.user.email}
                                    </SheetDescription>
                                </div>
                            </div>
                        </SheetHeader>

                        <Tabs defaultValue="profile" className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            <div className="px-6 pt-4 shrink-0 bg-background">
                                <TabsList className="grid w-full grid-cols-3 bg-muted/20 rounded-xl p-1 h-11">
                                    <TabsTrigger value="profile" className="font-bold rounded-lg transition-all">
                                        Profile
                                    </TabsTrigger>
                                    <TabsTrigger value="wallet" className="font-bold rounded-lg transition-all">
                                        Wallet
                                    </TabsTrigger>
                                    <TabsTrigger value="marketing" className="font-bold rounded-lg transition-all">
                                        Events
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="profile"
                                         className="flex-1 min-h-0 px-6 data-[state=active]:flex flex-col mt-0 pt-4">
                                <UserProfileTab
                                    data={data}
                                    effectivePricing={effectivePricing}
                                    onRoleToggle={handleRoleToggle}
                                    onBanToggle={handleBanToggle}
                                />
                            </TabsContent>

                            <TabsContent value="wallet"
                                         className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden px-6 data-[state=active]:flex mt-0 pt-4">
                                <UserWalletTab
                                    adjustAmt={adjustAmt} setAdjustAmt={setAdjustAmt}
                                    adjustNote={adjustNote} setAdjustNote={setAdjustNote}
                                    isAdjusting={isAdjusting} onAdjust={handleAdjust}
                                    pageSize={pageSize} setPageSize={setPageSize}
                                    setTxPage={setTxPage} txLoading={txLoading}
                                    transactions={transactions} txPage={txPage} totalPages={totalPages}
                                />
                            </TabsContent>

                            <TabsContent value="marketing"
                                         className="flex-1 min-h-0 px-6 data-[state=active]:flex flex-col mt-0 pt-4">
                                <UserMarketingTab campaigns={data.ongoingCampaigns}/>
                            </TabsContent>
                        </Tabs>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}