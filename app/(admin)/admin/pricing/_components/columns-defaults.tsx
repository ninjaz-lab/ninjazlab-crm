"use client";

import {ColumnDef} from "@tanstack/react-table";
import {formatPricingAmount, SortHeader} from "./columns-helpers";
import {PricingStatusBadge} from "@/components/badge/pricing-status-badge";
import {CampaignTypeBadge} from "@/components/badge/campaign-type-badge";
import {TableRowAction, TableRowActions} from "@/components/data-table/table-row-actions";
import {generateDateColumn} from "@/lib/utils/date";

export const getColumns = (
    onEdit: (rule: any) => void,
    setRuleToDelete: (rule: any) => void,
    isPending: boolean,
    allRules?: any[],
): ColumnDef<any>[] => [
    {
        id: "index",
        header: () => <div className="text-center font-bold uppercase text-[10px] tracking-widest w-[60px]">#</div>,
        cell: ({row, table}) => {
            const sortedIndex = table.getSortedRowModel().flatRows.findIndex(
                (r) => r.original.id === row.original.id
            );
            return <div className="text-center font-mono text-xs text-muted-foreground">{sortedIndex + 1}</div>;
        },
    },
    {
        accessorKey: "campaign",
        header: ({column}) => <SortHeader column={column} label="Campaign"/>,
        cell: ({row}) => {
            const camp = row.original.campaign;
            const campaignType = camp === "email_marketing" ? "email" : camp === "sms_marketing" ? "sms" : camp;
            return <CampaignTypeBadge type={campaignType as any}/>;
        },
    },
    {
        accessorKey: "unitPrice",
        header: ({column}) => <SortHeader column={column} label="Unit Price"/>,
        cell: ({row}) => {
            const r = row.original;
            return (
                <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-muted-foreground">MYR</span>
                        <span className="font-mono text-sm font-black text-foreground">
                            {formatPricingAmount(r.unitPrice)}
                        </span>
                    </div>
                    <span
                        className="text-[10px] text-muted-foreground font-medium lowercase italic">per {r.action}</span>
                </div>
            );
        },
    },
    {
        id: "status",
        accessorFn: (row) => row.effectiveFrom,
        header: ({column}) => <SortHeader column={column} label="Status"/>,
        cell: ({row}) => {
            const rule = row.original;
            const isLatest = !allRules || allRules.every(r =>
                r.campaign !== rule.campaign ||
                r.userId !== null ||
                new Date(r.effectiveFrom) <= new Date(rule.effectiveFrom)
            );
            return <PricingStatusBadge effectiveFrom={new Date(rule.effectiveFrom)} isLatest={isLatest}/>;
        },
    },
    generateDateColumn("effectiveFrom", "Effective From"),
    {
        id: "actions",
        header: () => <div className="w-12"/>,
        cell: ({row}) => {
            const r = row.original;
            const actions: TableRowAction[] = [
                {label: "Edit Rule", icon: "PencilEdit01Icon", onClick: () => onEdit(r), disabled: isPending},
                {
                    label: "Delete Rule",
                    icon: "Delete02Icon",
                    variant: "destructive",
                    onClick: () => setRuleToDelete(r),
                    disabled: isPending
                },
            ];
            return <div className="flex justify-end"><TableRowActions actions={actions}/></div>;
        },
    },
];
