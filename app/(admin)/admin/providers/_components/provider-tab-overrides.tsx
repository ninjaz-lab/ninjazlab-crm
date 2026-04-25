"use client";

import React, {useMemo} from "react";
import {DataTable} from "@/components/data-table/data-table";
import {getColumns} from "./columns";
import {ProviderConfig} from "./provider-dashboard";
import {HugeIcon} from "@/components/huge-icon";

interface Props {
    data: ProviderConfig[];
    isPending: boolean;
    onEdit: any;
    onDelete: any;
    actionSlot: React.ReactNode;
}

export function ProviderTabOverrides({data, isPending, onEdit, onDelete, actionSlot}: Props) {
    const columns = useMemo(() => getColumns(onEdit, onDelete, isPending, false), [onEdit, onDelete, isPending]);

    return (
        <div className="space-y-4 animate-in fade-in duration-300">

            <div
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 px-4 rounded-lg border bg-muted/30 shadow-sm text-sm">
                <div className="flex items-center gap-2 text-foreground shrink-0">
                    <HugeIcon name="UserIcon" size={16}/>
                    <span className="font-semibold">Tenant Overrides</span>
                </div>
                <p className="text-muted-foreground sm:border-l sm:pl-3 sm:border-border/50">
                    Dedicated API configurations for premium tenants, bypassing system defaults.
                </p>
            </div>

            {/* Table Container */}
            <DataTable columns={columns}
                       data={data}
                       hideSearch={false}
                       actionSlot={actionSlot}
            />

        </div>
    );
}