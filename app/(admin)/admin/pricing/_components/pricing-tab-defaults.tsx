"use client";

import React, {useMemo} from "react";
import {getColumns} from "./columns-defaults";
import {Rule} from "./pricing-dashboard";
import {DataTable} from "@/components/data-table/data-table";

interface Props {
    data: Rule[];
    isPending: boolean;
    onEdit: (rule: Rule) => void;
    onDelete: (rule: Rule) => void;
    actionSlot: React.ReactNode;
}

export function PricingTabDefaults({data, isPending, onEdit, onDelete, actionSlot}: Props) {
    const columns = useMemo(() => getColumns(onEdit, onDelete, isPending), [onEdit, onDelete, isPending]);

    return (
        <DataTable columns={columns}
                   data={data}
                   hideSearch={true}
                   actionSlot={actionSlot}
        />
    );
}
