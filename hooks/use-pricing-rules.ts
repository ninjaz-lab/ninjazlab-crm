import {useMemo, useState} from "react";

export type Rule = {
    id: string;
    userId: string | null;
    userName: string | null;
    userEmail: string | null;
    userImage: string | null;
    role?: string | null;
    campaign: string;
    action: string;
    unitPrice: string;
    currency: string;
    effectiveFrom: Date;
    note: string | null;
    createdAt: Date;
};

type DbUser = {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role: string | null;
};

interface UsePricingRulesProps {
    rules: Rule[];
    users: DbUser[];
}

export function usePricingRules({rules, users}: UsePricingRulesProps) {
    const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");

    const userRoleMap = useMemo(() => {
        const map: Record<string, string> = {};
        users.forEach(u => {
            if (u.id && u.role) map[u.id] = u.role;
        });
        return map;
    }, [users]);

    const enrichedRules = useMemo(() => {
        return rules.map(r => ({
            ...r,
            role: r.userId ? userRoleMap[r.userId] || null : null,
        }));
    }, [rules, userRoleMap]);

    const getRuleStatus = (rule: Rule) => {
        const now = new Date();
        const isLatest = enrichedRules.every(r =>
            r.userId !== rule.userId ||
            r.campaign !== rule.campaign ||
            new Date(r.effectiveFrom) <= new Date(rule.effectiveFrom)
        );

        if (!isLatest) return "EXPIRED";
        if (new Date(rule.effectiveFrom) > now) return "SCHEDULED";
        return "ACTIVE";
    };

    const defaultRules = useMemo(() => enrichedRules.filter((r) => !r.userId), [enrichedRules]);
    const overridesRules = useMemo(() => enrichedRules.filter((r) => !!r.userId), [enrichedRules]);

    const filteredDefaultRules = useMemo(() => {
        if (statusFilter === "ALL") return defaultRules;
        return defaultRules.filter(r => getRuleStatus(r) === statusFilter);
    }, [defaultRules, statusFilter]);

    const filteredOverridesRules = useMemo(() => {
        if (statusFilter === "ALL") return overridesRules;
        return overridesRules.filter(r => getRuleStatus(r) === statusFilter);
    }, [overridesRules, statusFilter]);

    const filterOptions = useMemo(() => [
        {label: "All", value: "ALL"},
        {label: "Active", value: "ACTIVE"},
        {label: "Scheduled", value: "SCHEDULED"},
        {label: "Expired", value: "EXPIRED"},
    ], []);

    return {
        statusFilter,
        setStatusFilter,
        enrichedRules,
        getRuleStatus,
        defaultRules,
        overridesRules,
        filteredDefaultRules,
        filteredOverridesRules,
        filterOptions,
    };
}
