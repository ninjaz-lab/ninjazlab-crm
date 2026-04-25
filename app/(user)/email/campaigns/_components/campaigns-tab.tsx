"use client";

import React, {useMemo} from "react";
import {DataTable} from "@/components/data-table/data-table";
import {getColumns} from "./columns";

interface Props {
    data: any[];
    actionSlot: React.ReactNode;
}

export function CampaignsTab({data, actionSlot}: Props) {
    const campaignCols = useMemo(() => getColumns(), []);

    const campaignsFilterFn = (row: any, columnId: string, filterValue: string) => {
        const q = filterValue.toLowerCase();
        return (
            (row.original.name?.toLowerCase() || "").includes(q) ||
            (row.original.fromName?.toLowerCase() || "").includes(q) ||
            (row.original.fromEmail?.toLowerCase() || "").includes(q)
        );
    };

    return (
        <DataTable columns={campaignCols}
                   data={data}
                   searchPlaceholder="Search campaigns or senders..."
                   globalFilterFn={campaignsFilterFn}
                   actionSlot={actionSlot}
        />
    );
}