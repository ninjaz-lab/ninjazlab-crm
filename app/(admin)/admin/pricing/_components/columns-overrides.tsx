"use client";

import {ColumnDef} from "@tanstack/react-table";
import {TableRowAction, TableRowActions} from "@/components/data-table/table-row-actions";
import {formatPricingAmount, SortHeader} from "./columns-helpers";
import {PricingStatusBadge} from "@/components/pricing-status-badge";
import {RoleAvatar} from "@/components/role-avatar";
import {CampaignTypeBadge} from "@/components/campaign-type-badge";
import {createDateColumn} from "@/lib/utils/date";

export const getColumns = (
    onEdit: (rule: any) => void,
    setRuleToDelete: (rule: any) => void,
    isPending: boolean,
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
        id: "userAccount",
        accessorFn: (row) => row.userName || "",
        header: ({column}) => <SortHeader column={column} label="User Account"/>,
        cell: ({row}) => {
            const r = row.original;
            return (
                <div className="flex items-center gap-3">
                    <RoleAvatar src={r.userImage}
                                name={r.userName}
                                role={r.role}
                    />
                    <div>
                        <p className="font-bold text-sm tracking-tight leading-none mb-1">{r.userName}</p>
                        <p className="text-[11px] text-muted-foreground font-medium">{r.userEmail}</p>
                    </div>
                </div>
            );
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
                        <span className="font-mono text-sm font-black text-foreground">
                            {formatPricingAmount(r.unitPrice)}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground">MYR</span>
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
        cell: ({row}) => <PricingStatusBadge effectiveFrom={new Date(row.original.effectiveFrom)}/>,
    },
    createDateColumn("effectiveFrom", "Effective From"),
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
