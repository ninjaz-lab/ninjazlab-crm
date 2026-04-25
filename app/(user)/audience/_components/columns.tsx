"use client";

import React from "react";
import {ColumnDef} from "@tanstack/react-table";
import {Badge} from "@/components/ui/badge";
import {Checkbox} from "@/components/ui/checkbox";
import {type AudienceRow} from "@/lib/actions/audience";
import {TableRowAction, TableRowActions} from "@/components/data-table/table-row-actions";

export const getColumns = (
    audiencesLength: number,
    selected: Set<string>,
    toggleAll: () => void,
    toggleSelect: (id: string) => void,
    setEditAudience: (audience: AudienceRow) => void,
    setDeleteId: (id: string) => void
): ColumnDef<AudienceRow>[] => [
    {
        id: "select",
        header: () => (
            <div className="flex justify-center w-[50px]">
                <Checkbox
                    checked={audiencesLength > 0 && selected.size === audiencesLength}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                />
            </div>
        ),
        cell: ({row}) => (
            <div className="flex justify-center w-[50px]">
                <Checkbox
                    checked={selected.has(row.original.id)}
                    onCheckedChange={() => toggleSelect(row.original.id)}
                    aria-label="Select row"
                />
            </div>
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        id: "name",
        header: () => <div className="font-bold">Name</div>,
        cell: ({row}) => {
            const c = row.original;
            const fullName = [c.firstName, c.lastName].filter(Boolean).join(" ") || "—";
            return <span className="font-medium tracking-tight">{fullName}</span>;
        }
    },
    {
        accessorKey: "email",
        header: () => <div className="font-bold">Email</div>,
        cell: ({row}) => <span className="text-muted-foreground font-medium">{row.original.email ?? "—"}</span>,
    },
    {
        accessorKey: "phone",
        header: () => <div className="font-bold">Phone</div>,
        cell: ({row}) => <span className="text-muted-foreground font-medium">{row.original.phone ?? "—"}</span>,
    },
    {
        accessorKey: "source",
        header: () => <div className="font-bold">Source</div>,
        cell: ({row}) => (
            <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest bg-muted/20">
                {row.original.source}
            </Badge>
        ),
    },
    {
        id: "actions",
        header: () => <div className="w-10 pr-4"/>,
        cell: ({row}) => {
            const c = row.original;

            const actions: TableRowAction[] = [
                {
                    label: "Edit",
                    icon: "PencilEdit01Icon",
                    onClick: () => setEditAudience(c),
                },
                {
                    label: "Delete",
                    icon: "Delete02Icon",
                    variant: "destructive",
                    onClick: () => setDeleteId(c.id),
                }
            ];

            return (
                <div className="flex justify-end pr-4">
                    <TableRowActions actions={actions}/>
                </div>
            );
        }
    }
];
