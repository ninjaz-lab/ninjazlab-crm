"use client";

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

// Define the available styling variants for actions
export type ActionVariant = "default" | "success" | "destructive" | "warning";

export interface DataTableAction {
    label: string;
    icon: string;
    onClick: () => void;
    variant?: ActionVariant;
    disabled?: boolean;
    hidden?: boolean; // Useful for conditionally hiding actions without complex ternary operators
}

interface DataTableActionsProps {
    actions: DataTableAction[];
    label?: string; // Optional: Defaults to "Actions"
}

const variantStyles: Record<ActionVariant, string> = {
    default: "text-foreground",
    success: "text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50",
    warning: "text-amber-600 focus:text-amber-600 focus:bg-amber-50",
    destructive: "text-destructive focus:text-destructive focus:bg-destructive/10",
};

export function DataTableActions({actions, label = "Actions"}: DataTableActionsProps) {
    const visibleActions = actions.filter((a) => !a.hidden);

    if (visibleActions.length === 0) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground outline-none">
                    <span className="sr-only">Open menu</span>
                    <HugeIcon name="MoreHorizontalIcon" size={16}/>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    {label}
                </DropdownMenuLabel>
                <DropdownMenuSeparator/>

                {visibleActions.map((action, index) => (
                    <DropdownMenuItem
                        key={index}
                        onClick={action.onClick}
                        disabled={action.disabled}
                        className={cn(
                            "cursor-pointer font-medium transition-colors",
                            variantStyles[action.variant || "default"]
                        )}
                    >
                        <HugeIcon name={action.icon as any} size={14} className="mr-2"/>
                        {action.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}