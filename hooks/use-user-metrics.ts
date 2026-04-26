import {useCallback, useMemo, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {USER_ROLES} from "@/lib/enums";

interface UseUserMetricsProps {
    users: any[];
    totalUsers: number;
    totalSuperadmins: number;
    totalAdmins: number;
    totalRegularUsers: number;
    currentRole: string | null;
}

export function useUserMetrics({
    users,
    totalUsers,
    totalSuperadmins,
    totalAdmins,
    totalRegularUsers,
    currentRole,
}: UseUserMetricsProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [roleFilter, setRoleFilter] = useState<string>(currentRole || "ALL");

    // Handle role filter change
    const handleRoleFilter = useCallback((role: string | null) => {
        const roleValue = role || "ALL";
        setRoleFilter(roleValue);

        const params = new URLSearchParams(searchParams);
        if (role) {
            params.set("role", role);
        } else {
            params.delete("role");
        }
        params.set("page", "1");
        router.push(`?${params.toString()}`);
    }, [router, searchParams]);

    // Calculate metrics
    const metrics = useMemo(() => {
        return {
            superadmins: totalSuperadmins,
            admins: totalAdmins,
            users: totalRegularUsers,
        };
    }, [totalSuperadmins, totalAdmins, totalRegularUsers]);

    // Filter users based on selected role
    const filteredUsers = useMemo(() => {
        if (roleFilter === "ALL" || !roleFilter) return users;
        return users.filter(u => u.role === roleFilter);
    }, [users, roleFilter]);

    // Filter options for dropdown
    const filterOptions = useMemo(() => [
        {label: "All", value: "ALL"},
        {label: "Superadmins", value: USER_ROLES.SUPERADMIN},
        {label: "Admins", value: USER_ROLES.ADMIN},
        {label: "Users", value: USER_ROLES.USER},
    ], []);

    return {
        roleFilter,
        handleRoleFilter,
        metrics,
        filteredUsers,
        filterOptions,
        totalRowsCount: roleFilter !== "ALL" ? filteredUsers.length : totalUsers,
    };
}
