"use client";

import Link from "next/link";
import {Button} from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {HugeIcon} from "@/components/huge-icon";
import {cn} from "@/lib/utils/utils";

export type ActionVariant = "default" | "success" | "destructive" | "warning";

export interface TableRowAction {
    label: string;
    icon: string;
    onClick?: () => void;
    href?: string;
    variant?: ActionVariant;
    disabled?: boolean;
    hidden?: boolean;
}

interface TableRowActionsProps {
    actions: TableRowAction[];
    label?: string;
}

const variantStyles: Record<ActionVariant, string> = {
    default: "text-foreground",
    success: "text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50",
    warning: "text-amber-600 focus:text-amber-600 focus:bg-amber-50",
    destructive: "text-destructive focus:text-destructive focus:bg-destructive/10",
};

export function TableRowActions(
    {
        actions,
        label = "Actions"
    }: TableRowActionsProps
) {
    const visibleActions = actions.filter((a) => !a.hidden);

    if (visibleActions.length === 0) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost"
                        className="size-8 p-0 rounded-full bg-muted/30 hover:bg-primary/10 data-[state=open]:bg-primary/10 transition-all group ml-auto flex outline-none"
                >
                    <span className="sr-only">Open menu</span>
                    <HugeIcon name="MoreHorizontalIcon"
                              size={16}
                              className="text-muted-foreground group-hover:text-primary group-data-[state=open]:text-primary transition-all"
                    />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end"
                                 className="w-40 rounded-xl shadow-xl">
                <DropdownMenuLabel className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    {label}
                </DropdownMenuLabel>
                <DropdownMenuSeparator/>

                {visibleActions.map((action, index) => {
                    const itemClasses = cn(
                        "cursor-pointer font-medium transition-colors",
                        variantStyles[action.variant || "default"]
                    );

                    if (action.href) {
                        return (
                            <DropdownMenuItem key={index}
                                              asChild
                                              disabled={action.disabled}
                                              className={itemClasses}>
                                <Link href={action.href}>
                                    <HugeIcon name={action.icon as any} size={14} className="mr-2"/>
                                    {action.label}
                                </Link>
                            </DropdownMenuItem>
                        );
                    }

                    return (
                        <DropdownMenuItem key={index}
                                          onClick={action.onClick}
                                          disabled={action.disabled}
                                          className={itemClasses}
                        >
                            <HugeIcon name={action.icon as any}
                                      size={14}
                                      className="mr-2"/>
                            {action.label}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
