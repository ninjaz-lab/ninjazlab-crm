"use client";

import React, {useMemo} from "react";
import {DataTable} from "@/components/data-table/data-table";
import {getColumns} from "./columns";

interface Props {
    data: any[];
    actionSlot: React.ReactNode;
}

export function InvoicesTab({data, actionSlot}: Props) {
    const invoiceColumns = useMemo(() => getColumns("invoices"), []);

    const invoiceFilterFn = (
        row: any,
        columnId: string,
        filterValue: any
    ) => {
        if (!filterValue) return true;
        const searchValue = String(filterValue).toLowerCase();
        const invoiceMatch = (row.original.invoiceNumber?.toLowerCase() || "").includes(searchValue);
        const txId = (row.original.transactionId || "").toLowerCase();
        const idMatch = txId.includes(searchValue);
        return invoiceMatch || idMatch;
    };

    return (
        <DataTable
            columns={invoiceColumns}
            data={data}
            searchPlaceholder="Search invoice records..."
            globalFilterFn={invoiceFilterFn}
            actionSlot={actionSlot}
        />
    );
}
