"use client";

import React, {useMemo} from "react";
import {getColumns} from "./columns-defaults";
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

export function PricingTabDefaults({data, isPending, onEdit, onDelete, actionSlot, allRules}: Props) {
    const columns = useMemo(() => getColumns(onEdit, onDelete, isPending, allRules), [onEdit, onDelete, isPending, allRules]);

    return (
        <div className="space-y-4 animate-in fade-in duration-300">

            <div
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 px-4 rounded-lg border bg-muted/30 shadow-sm text-sm">
                <div className="flex items-center gap-2 text-primary shrink-0">
                    <HugeIcon name="GlobalIcon" size={16}/>
                    <span className="font-semibold">Default Rates</span>
                </div>
                <p className="text-muted-foreground sm:border-l sm:pl-3 sm:border-border/50">
                    Fallback pricing used automatically when users lack specific overrides.
                </p>
            </div>

            <DataTable columns={columns}
                       data={data}
                       hideSearch={true}
                       actionSlot={actionSlot}
            />
        </div>
    );
}
