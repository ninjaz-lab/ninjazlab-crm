"use client";

import React, {useMemo} from "react";
import {getColumns} from "./columns-overrides";
import {Rule} from "./pricing-dashboard";
import {DataTable} from "@/components/data-table/data-table";
import {HugeIcon} from "@/components/huge-icon";

interface Props {
    data: Rule[];
    isPending: boolean;
    onEdit: (rule: Rule) => void;
    onDelete: (rule: Rule) => void;
    actionSlot: React.ReactNode;
    allRules?: Rule[];
}

export function PricingTabOverrides({data, isPending, onEdit, onDelete, actionSlot, allRules}: Props) {
    const columns = useMemo(() => getColumns(onEdit, onDelete, isPending, allRules), [onEdit, onDelete, isPending, allRules]);

    const filterFn = (row: any, columnId: string, filterValue: string) => {
        const q = filterValue.toLowerCase();
        const name = row.original.userName?.toLowerCase() || "";
        const email = row.original.userEmail?.toLowerCase() || "";
        const note = row.original.note?.toLowerCase() || "";
        return name.includes(q) || email.includes(q) || note.includes(q);
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-300">

            <div
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 px-4 rounded-lg border bg-muted/30 shadow-sm text-sm">
                <div className="flex items-center gap-2 text-primary shrink-0">
                    <HugeIcon name="UserIcon" size={16}/>
                    <span className="font-semibold">Custom Overrides</span>
                </div>
                <p className="text-muted-foreground sm:border-l sm:pl-3 sm:border-border/50">
                    Dedicated pricing configurations for specific users.
                </p>
            </div>

            <DataTable columns={columns}
                       data={data}
                       searchPlaceholder="Filter users by name, email or notes..."
                       globalFilterFn={filterFn}
                       actionSlot={actionSlot}
            />
        </div>
    );
}
