"use client";

import {useMemo, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {UserDetailSheet} from "./user-detail-sheet";
import {getColumns} from "@/app/(admin)/admin/users/_components/columns";
import {DataTable} from "@/components/data-table/data-table";
import {DataTableFilter} from "@/components/data-table/data-table-filter";
import {UserMetrics} from "@/app/(admin)/admin/users/_components/user-metrics";
import {useUserMetrics} from "@/hooks/use-user-metrics";

interface Props {
    currentUserId: string;
    users: any[];
    totalUsers: number;
    totalModules: number;
    page: number;
    pageSize: number;
    totalSuperadmins: number;
    totalAdmins: number;
    totalRegularUsers: number;
    currentRole: string | null;
}

export function UsersDashboard({
                                   currentUserId,
                                   users,
                                   totalUsers,
                                   totalModules,
                                   page,
                                   pageSize,
                                   totalSuperadmins,
                                   totalAdmins,
                                   totalRegularUsers,
                                   currentRole
                               }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [detailUserId, setDetailUserId] = useState<string | null>(null);

    const {
        roleFilter,
        handleRoleFilter,
        metrics,
        filteredUsers,
        filterOptions,
        totalRowsCount
    } = useUserMetrics({
        users,
        totalUsers,
        totalSuperadmins,
        totalAdmins,
        totalRegularUsers,
        currentRole
    });

    const columns = useMemo(
        () => getColumns(currentUserId, totalModules, page - 1, pageSize),
        [currentUserId, page, pageSize, totalModules]
    );

    function handleSearch(term: string) {
        const params = new URLSearchParams(searchParams);
        if (term) params.set("q", term);
        else params.delete("q");
        params.set("page", "1");
        router.push(`?${params.toString()}`);
    }

    function changePage(newPage: number) {
        const params = new URLSearchParams(searchParams);
        params.set("page", newPage.toString());
        router.push(`?${params.toString()}`);
    }

    function changePageSize(newSize: number) {
        const params = new URLSearchParams(searchParams);
        params.set("pageSize", String(newSize));
        params.set("page", "1");
        router.push(`?${params.toString()}`);
    }

    return (
        <div className="space-y-6">

            {/* User Statistics & Filter */}
            <UserMetrics metrics={metrics}
                         setRoleFilter={handleRoleFilter}/>

            <DataTable columns={columns}
                       data={filteredUsers}
                       searchPlaceholder="Filter users by name or email..."
                       onRowClick={(row) => setDetailUserId(row.id)}
                       actionSlot={
                           <DataTableFilter icon="FilterIcon"
                                            value={roleFilter}
                                            onChange={(role) => handleRoleFilter(role === "ALL" ? null : role)}
                                            options={filterOptions}
                           />
                       }

                       isServerSide={true}
                       totalRows={totalRowsCount}
                       currentPage={page}
                       pageSize={pageSize}
                       searchValue={searchParams.get("q") ?? ""}
                       onSearch={handleSearch}
                       onPageChange={changePage}
                       onPageSizeChange={changePageSize}
            />

            <UserDetailSheet userId={detailUserId}
                             open={!!detailUserId}
                             onOpenChangeAction={(open) => {
                                 if (!open)
                                     setDetailUserId(null);
                             }}
            />
        </div>
    );
}