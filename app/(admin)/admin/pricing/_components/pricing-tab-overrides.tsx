"use client";

import React, {useMemo} from "react";
import {getColumns} from "./columns-overrides";
import {Rule} from "./pricing-dashboard";
import {DataTable} from "@/components/data-table/data-table";

interface Props {
    data: Rule[];
    isPending: boolean;
    onEdit: (rule: Rule) => void;
    onDelete: (rule: Rule) => void;
    actionSlot: React.ReactNode;
}

export function PricingTabOverrides({data, isPending, onEdit, onDelete, actionSlot}: Props) {
    const columns = useMemo(() => getColumns(onEdit, onDelete, isPending), [onEdit, onDelete, isPending]);

    const filterFn = (row: any, columnId: string, filterValue: string) => {
        const q = filterValue.toLowerCase();
        const name = row.original.userName?.toLowerCase() || "";
        const email = row.original.userEmail?.toLowerCase() || "";
        const note = row.original.note?.toLowerCase() || "";
        return name.includes(q) || email.includes(q) || note.includes(q);
    };

    return (
        <DataTable columns={columns}
                   data={data}
                   searchPlaceholder="Filter users by name, email or notes..."
                   globalFilterFn={filterFn}
                   actionSlot={actionSlot}
        />
    );
}
