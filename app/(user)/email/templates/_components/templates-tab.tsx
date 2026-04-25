"use client";

import React, {useMemo} from "react";
import {DataTable} from "@/components/data-table/data-table";
import {getColumns} from "./columns";

interface Props {
    data: any[];
    actionSlot: React.ReactNode;
}

export function TemplatesTab({data, actionSlot}: Props) {
    const templateCols = useMemo(() => getColumns(), []);

    const templatesFilterFn = (row: any, columnId: string, filterValue: string) => {
        const q = filterValue.toLowerCase();
        return (
            (row.original.name?.toLowerCase() || "").includes(q) ||
            (row.original.subject?.toLowerCase() || "").includes(q)
        );
    };

    return (
        <DataTable
            columns={templateCols}
            data={data}
            searchPlaceholder="Search template names or subjects..."
            globalFilterFn={templatesFilterFn}
            actionSlot={actionSlot}
        />
    );
}