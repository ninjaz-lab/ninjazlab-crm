"use client";

import React, {useMemo} from "react";
import {DataTable} from "@/components/data-table";
import {getColumns} from "./columns";

interface TabProps {
    data: any[];
    actionSlot: React.ReactNode;
}

export function TransactionsTab({data, actionSlot}: TabProps) {
    const transactionColumns = useMemo(() => getColumns("transactions"), []);

    const transactionFilterFn = (row: any, columnId: string, filterValue: string) => {
        if (!filterValue) return true;
        const searchValue = String(filterValue).toLowerCase();
        const descriptionMatch = (row.original.description?.toLowerCase() || "").includes(searchValue);
        const txId = row.original.id as string;
        const shortId = txId ? `trn-${txId.substring(0, 8).toLowerCase()}` : "";
        const idMatch = shortId.includes(searchValue);
        return descriptionMatch || idMatch;
    };

    return (
        <DataTable
            columns={transactionColumns}
            data={data}
            searchPlaceholder="Search transaction records..."
            globalFilterFn={transactionFilterFn}
            actionSlot={actionSlot}
        />
    );
}