"use client";

import React, {useMemo} from "react";
import {DataTable} from "@/components/data-table";
import {getColumns} from "./columns";
import {Rule} from "./pricing-manager";

interface PricingOverridesTabProps {
    data: Rule[];
    isPending: boolean;
    onEdit: (rule: Rule) => void;
    onDelete: (rule: Rule) => void;
    actionSlot: React.ReactNode;
}

export function PricingOverridesTab(
    {
        data,
        isPending,
        onEdit,
        onDelete,
        actionSlot
    }: PricingOverridesTabProps
) {
    const columns = useMemo(() => getColumns(onEdit, onDelete, isPending, false), [onEdit, onDelete, isPending]);

    const filterFn = (row: any, columnId: string, filterValue: string) => {
        const q = filterValue.toLowerCase();
        const name = row.original.userName?.toLowerCase() || "";
        const email = row.original.userEmail?.toLowerCase() || "";
        const note = row.original.note?.toLowerCase() || "";
        return name.includes(q) || email.includes(q) || note.includes(q);
    };

    return (
        <DataTable
            columns={columns}
            data={data}
            searchPlaceholder="Filter users by name, email or notes..."
            globalFilterFn={filterFn}
            actionSlot={actionSlot}
        />
    );
}
