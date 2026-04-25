import {HugeIcon} from "@/components/huge-icon";
import {cn} from "@/lib/utils/utils";
import {Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import React from "react";

interface Props {
    title: string;
    description?: string;
    icon?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    contentClassName?: string;
}

export function DashboardPanel({title, description, icon, action, children, className, contentClassName,}: Props) {
    return (
        <Card
            className={cn(
                "gap-0 py-0 overflow-hidden border-border/60 shadow-[0_1px_2px_0_rgb(0_0_0/0.03)]",
                "hover:border-border hover:shadow-[0_2px_8px_-2px_rgb(0_0_0/0.06)] transition-all duration-200",
                className
            )}
        >
            <CardHeader className="px-5 pt-4 pb-3.5 gap-1">
                <CardTitle
                    className="flex items-center gap-2.5 text-[13px] font-semibold tracking-[-0.01em] leading-none">
                    {icon && (
                        <span
                            className={cn(
                                "flex items-center justify-center w-6 h-6 rounded-md shrink-0",
                                "bg-gradient-to-b from-muted/80 to-muted/40",
                                "ring-1 ring-inset ring-border/70",
                                "shadow-[inset_0_1px_0_0_rgb(255_255_255/0.5)]"
                            )}
                        >
                            <HugeIcon name={icon as any} size={13} className="text-foreground/80"/>
                        </span>
                    )}
                    <span className="truncate">{title}</span>
                </CardTitle>
                {description && (
                    <CardDescription className="text-[11px] text-muted-foreground/80 ml-[34px]">
                        {description}
                    </CardDescription>
                )}
                {action && <CardAction>{action}</CardAction>}
            </CardHeader>

            {/* Refined divider — softer than a full separator */}
            <div className="h-px bg-gradient-to-r from-transparent via-border/70 to-transparent"/>

            <CardContent
                className={cn(
                    "px-5 py-4 bg-gradient-to-b from-muted/10 to-transparent",
                    contentClassName
                )}
            >
                <dl className="flex flex-col gap-2.5">
                    {children}
                </dl>
            </CardContent>
        </Card>
    );
}

interface DataRowProps {
    label: string;
    value: React.ReactNode;
    icon?: string;
    mono?: boolean;
    className?: string;
}

export function DataRow({label, value, icon, mono, className}: DataRowProps) {
    return (
        <div
            className={cn(
                "flex items-center justify-between gap-4 min-h-[24px] group",
                className
            )}
        >
            <dt className="flex items-center gap-2 text-[12px] text-muted-foreground/90 font-normal shrink-0">
                {icon && (
                    <HugeIcon
                        name={icon as any}
                        size={12}
                        className="text-muted-foreground/60 group-hover:text-muted-foreground transition-colors"
                    />
                )}
                <span>{label}</span>
            </dt>
            <dd
                className={cn(
                    "text-[13px] font-medium text-foreground text-right truncate tabular-nums tracking-[-0.005em]",
                    mono && "font-mono text-[12px] tracking-normal"
                )}
            >
                {value}
            </dd>
        </div>
    );
}

// --- Empty State ---
interface EmptyProps {
    icon: string;
    title: string;
    description: string;
    action?: React.ReactNode;
}

export function EmptyState({icon, title, description, action}: EmptyProps) {
    return (
        <div className="w-full flex flex-col items-center justify-center text-center py-10 px-4">
            <div
                className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full mb-3",
                    "bg-gradient-to-b from-muted/80 to-muted/40",
                    "ring-1 ring-inset ring-border/70"
                )}
            >
                <HugeIcon name={icon as any} size={16} className="text-muted-foreground/80"/>
            </div>
            <p className="text-[13px] font-semibold text-foreground tracking-[-0.01em]">{title}</p>
            <p className="text-[11px] text-muted-foreground/80 mt-1 mb-4 max-w-xs">{description}</p>
            {action}
        </div>
    );
}
