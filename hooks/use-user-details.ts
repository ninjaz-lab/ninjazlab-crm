import {useCallback, useEffect, useMemo, useState} from "react";
import {toast} from "sonner";
import {banUser, fetchUserFullDetails, setUserRole, unbanUser} from "@/lib/actions/admin/users";
import {adjustWalletBalance, fetchWalletTransactions} from "@/lib/actions/admin/wallet";
import {USER_ROLES} from "@/lib/enums";
import {fetchAllModules} from "@/lib/actions/admin/module";

export function useUserDetail(userId: string | null, open: boolean) {
    const [data, setData] = useState<any>(null);
    const [allModules, setAllModules] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Wallet Transaction State
    const [transactions, setTransactions] = useState<any[]>([]);
    const [totalTx, setTotalTx] = useState(0);
    const [txPage, setTxPage] = useState(1);
    const [pageSize, setPageSize] = useState("10");
    const [txLoading, setTxLoading] = useState(false);

    // Wallet Adjustment State
    const [adjustAmt, setAdjustAmt] = useState("");
    const [adjustNote, setAdjustNote] = useState("");
    const [isAdjusting, setIsAdjusting] = useState(false);

    // Fetch Profile
    const loadProfile = useCallback(async () => {
        if (!userId) return;
        setLoading(true);

        try {
            const [profileRes, modulesRes] = await Promise.all([
                fetchUserFullDetails(userId),
                fetchAllModules()
            ]);
            setData(profileRes);
            setAllModules(modulesRes);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Fetch Wallet Transactions
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

    // Initial Load
    useEffect(() => {
        if (open && userId) {
            setData(null);
            setTransactions([]);
            setTxPage(1);
            void loadProfile();
        }
    }, [open, userId, loadProfile]);

    // Pagination Load
    useEffect(() => {
        if (open && userId) {
            void loadTx();
        }
    }, [open, userId, txPage, pageSize, loadTx]);

    // Derived State: Effective Pricing
    const effectivePricing = useMemo(() => {
        const now = new Date();

        const getActiveRule = (rulesList: any[], campaign: string) => {
            return rulesList
                .filter(r => r.campaign === campaign && new Date(r.effectiveFrom) <= now)
                .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime())[0];
        };

        const defaultRules = data?.defaultPricing || [];
        const overrideRules = data?.pricingRules || [];
        const allCampaigns = Array.from(new Set([...defaultRules, ...overrideRules].map(r => r.campaign)));

        const pricing: any[] = [];

        allCampaigns.forEach(campaign => {
            const activeOverride = getActiveRule(overrideRules, campaign);
            const activeDefault = getActiveRule(defaultRules, campaign);

            if (activeOverride)
                pricing.push({...activeOverride, isOverride: true, originalPrice: activeDefault?.unitPrice});
            else if (activeDefault)
                pricing.push({...activeDefault, isOverride: false});
        });

        return pricing;
    }, [data]);

    // Derived State: Pagination helpers
    const balance = parseFloat(data?.profile?.wallets?.balance ?? "0");
    const totalPages = Math.max(1, Math.ceil(totalTx / parseInt(pageSize)));

    // Actions
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
            toast.success(`Role changed to ${newRole}`);
            setData((prev: any) => ({
                ...prev,
                profile: {...prev.profile, user: {...prev.profile.user, role: newRole}}
            }));
        } catch {
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
            setData((prev: any) => ({
                ...prev,
                profile: {...prev.profile, user: {...prev.profile.user, banned: !isBanned}}
            }));
        } catch {
            toast.error("Failed to update ban status.");
        }
    }

    // Local mutation for module updates (prevents full sheet reload)
    function handleUpdateUser(updatedUser: any) {
        setData((prev: any) => ({
            ...prev,
            profile: {...prev.profile, user: updatedUser}
        }));
    }

    return {
        data, loading,
        allModules,
        balance,
        effectivePricing,
        transactions, totalTx,
        txPage, setTxPage,
        pageSize, setPageSize,
        txLoading,
        totalPages,
        adjustAmt, setAdjustAmt,
        adjustNote, setAdjustNote,
        isAdjusting, handleAdjust,
        handleRoleToggle,
        handleBanToggle,
        handleUpdateUser
    };
}
