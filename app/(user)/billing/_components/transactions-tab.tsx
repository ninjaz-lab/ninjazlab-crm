"use client";

import React, {useMemo} from "react";
import {DataTable} from "@/components/data-table/data-table";
import {getColumns} from "./columns";

interface Props {
    data: any[];
    actionSlot: React.ReactNode;
}

export function TransactionsTab({data, actionSlot}: Props) {
    const transactionColumns = useMemo(() => getColumns("transactions"), []);

    const transactionFilterFn = (row: any, columnId: string, filterValue: string) => {
        if (!filterValue) return true;
        const searchValue = String(filterValue).toLowerCase();
        const descriptionMatch = (row.original.description?.toLowerCase() || "").includes(searchValue);
        const txId = (row.original.transactionId || "").toLowerCase();
        const idMatch = txId.includes(searchValue);
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