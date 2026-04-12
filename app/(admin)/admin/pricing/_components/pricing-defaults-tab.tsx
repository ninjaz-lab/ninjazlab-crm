"use client";

import React, {useMemo} from "react";
import {DataTable} from "@/components/data-table";
import {getColumns} from "./columns";
import {Rule} from "./pricing-manager";

interface PricingDefaultsTabProps {
    data: Rule[];
    isPending: boolean;
    onEdit: (rule: Rule) => void;
    onDelete: (rule: Rule) => void;
    actionSlot: React.ReactNode;
}

export function PricingDefaultsTab(
    {
        data,
        isPending,
        onEdit,
        onDelete,
        actionSlot
    }: PricingDefaultsTabProps
) {
    const columns = useMemo(() => getColumns(onEdit, onDelete, isPending, true), [onEdit, onDelete, isPending]);

    return (
        <DataTable
            columns={columns}
            data={data}
            hideSearch={true}
            actionSlot={actionSlot}
        />
    );
}
