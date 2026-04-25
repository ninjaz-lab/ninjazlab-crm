"use client";

import {HugeIcon} from "@/components/huge-icon";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {cn} from "@/lib/utils/utils";
import {formatAmount} from "@/lib/utils/transactions";
import {UserTab} from "@/app/(admin)/admin/users/_components/user-tab";
import {useUserDetail} from "@/hooks/use-user-details";
import {RoleAvatar} from "@/components/role-avatar";
import {UserStatusBadge} from "@/components/user-status-badge";

export function UserDetailSheet({userId, open, onOpenChangeAction}: {
    userId: string | null; open: boolean; onOpenChangeAction: (open: boolean) => void;
}) {
    const {
        data, loading,
        allModules,
        balance,
        effectivePricing,
        transactions,
        txPage, setTxPage,
        pageSize, setPageSize,
        txLoading,
        totalPages, totalTx,
        adjustAmt, setAdjustAmt,
        adjustNote, setAdjustNote,
        isAdjusting, handleAdjust,
        handleRoleToggle, handleBanToggle,
        handleUpdateUser
    } = useUserDetail(userId, open);

    if (!userId) return null;

    const isBanned = data?.profile?.user?.banned;

    return (
        <Sheet open={open} onOpenChange={onOpenChangeAction}>
            <SheetContent
                className="w-full sm:max-w-3xl p-0 flex flex-col gap-0 border-l shadow-2xl h-full overflow-hidden">

                {loading || !data ? (
                    <>
                        <SheetHeader className="sr-only">
                            <SheetTitle>Loading User</SheetTitle>
                            <SheetDescription>Retrieving user data...</SheetDescription>
                        </SheetHeader>
                        <div className="flex-1 flex flex-col items-center justify-center bg-muted/10">
                            <HugeIcon name="Loading02Icon" size={32}
                                      className="animate-spin text-primary opacity-50 mb-4"/>
                            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground animate-pulse">
                                Syncing Account Data...
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <SheetHeader className="px-6 pt-5 pb-4 border-b bg-muted/5 relative overflow-hidden shrink-0">
                            <div
                                className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent pointer-events-none"/>
                            <div className="relative z-10 space-y-3">

                                {/* Row 1: Avatar + Name/Email + Status — pr-12 for SheetClose X button */}
                                <div className="flex items-center gap-3 pr-12">
                                    <RoleAvatar src={data.profile.user.image}
                                                name={data.profile.user.name}
                                                role={data.profile.user.role}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <SheetTitle className="text-lg font-black tracking-tight leading-none mb-0.5">
                                            {data.profile.user.name || "User Account"}
                                        </SheetTitle>
                                        <SheetDescription className="text-xs font-medium truncate">
                                            {data.profile.user.email}
                                        </SheetDescription>
                                    </div>
                                    <UserStatusBadge banned={!!isBanned}/>
                                </div>

                                {/* Row 2: Wallet balance */}
                                <div className="flex justify-end">
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-0.5">
                                            Wallet Balance
                                        </p>
                                        <p className={cn("text-lg font-mono font-black leading-none", balance < 0 ? "text-rose-600" : "text-emerald-600")}>
                                            {formatAmount(balance)} <span
                                            className="text-[9px] text-muted-foreground font-bold">MYR</span>
                                        </p>
                                    </div>
                                </div>

                            </div>
                        </SheetHeader>

                        <UserTab data={data}
                                 allModules={allModules}
                                 effectivePricing={effectivePricing}
                                 onRoleToggle={handleRoleToggle}
                                 onBanToggle={handleBanToggle}
                                 onUpdateUser={handleUpdateUser}
                                 walletProps={{
                                     adjustAmt, setAdjustAmt,
                                     adjustNote, setAdjustNote,
                                     isAdjusting, onAdjust: handleAdjust,
                                     pageSize, setPageSize,
                                     setTxPage,
                                     txLoading,
                                     transactions,
                                     txPage, totalPages,
                                     totalTx
                                 }}
                        />
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
