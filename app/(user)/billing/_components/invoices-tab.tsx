"use client";

import React, {useMemo} from "react";
import {DataTable} from "@/components/data-table";
import {getColumns} from "./columns";

interface TabProps {
    data: any[];
    actionSlot: React.ReactNode;
}

export function InvoicesTab({data, actionSlot}: TabProps) {
    const invoiceColumns = useMemo(() => getColumns("invoices"), []);

    const invoiceFilterFn = (row: any, columnId: string, filterValue: any) => {
        if (!filterValue) return true;
        const searchValue = String(filterValue).toLowerCase();
        const invoiceMatch = (row.original.invoiceNumber?.toLowerCase() || "").includes(searchValue);
        const txId = row.original.id as string;
        const shortId = txId ? `trn-${txId.substring(0, 8).toLowerCase()}` : "";
        const idMatch = shortId.includes(searchValue);
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
