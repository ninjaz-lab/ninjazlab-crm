"use client";

import React from "react";
import {ColumnDef} from "@tanstack/react-table";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Checkbox} from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {type AudienceRow} from "@/lib/actions/audience";
import {HugeIcon} from "@/components/huge-icon";

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
        header: () => <div className="w-10"/>,
        cell: ({row}) => {
            const c = row.original;
            return (
                <div className="flex justify-end pr-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                                <HugeIcon name="MoreHorizontalIcon" size={16} className="opacity-50"/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => setEditAudience(c)} className="font-bold cursor-pointer">
                                <HugeIcon name="PencilEdit01Icon" size={16} className="mr-2"/> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem
                                className="text-destructive focus:bg-destructive/10 font-bold cursor-pointer"
                                onClick={() => setDeleteId(c.id)}
                            >
                                <HugeIcon name="Delete02Icon" size={16} className="mr-2"/> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        }
    }
];