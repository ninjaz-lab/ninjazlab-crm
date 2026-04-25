"use client";

import {useMemo, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {UserDetailSheet} from "./user-detail-sheet";
import {DataTable} from "@/components/data-table/data-table";
import {getColumns} from "@/app/(admin)/admin/users/_components/columns";

interface Props {
    currentUserId: string;
    users: any[];
    totalUsers: number;
    totalModules: number;
    page: number;
    pageSize: number;
}

export function UsersDashboard({currentUserId, users, totalUsers, totalModules, page, pageSize}: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [detailUserId, setDetailUserId] = useState<string | null>(null);

    // Pass required state into our Column Factory
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

            <DataTable columns={columns}
                       data={users}
                       searchPlaceholder="Filter users by name or email..."
                       onRowClick={(row) => setDetailUserId(row.id)}

                // Server-Side Config
                       isServerSide={true}
                       totalRows={totalUsers}
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