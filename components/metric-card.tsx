"use client";

import {cn} from "@/lib/utils/utils";
import {HugeIcon} from "@/components/huge-icon";
import React from "react";

export type MetricCardVariant = "default" | "primary" | "success" | "warning" | "destructive";

interface MetricCardProps {
    title: string;
    value?: string | number;
    icon: string;
    variant?: MetricCardVariant;
    children?: React.ReactNode;
    className?: string;
}

const variantStyles: Record<MetricCardVariant, {
    text: string;
    iconBg?: string;
    valueText?: string;
}> = {
    default: {text: "text-muted-foreground", valueText: "text-foreground"},
    primary: {text: "text-primary", iconBg: "bg-primary/10", valueText: "text-primary"},
    success: {text: "text-emerald-600", iconBg: "bg-emerald-500/10", valueText: "text-emerald-600"},
    warning: {text: "text-amber-600", iconBg: "bg-amber-500/10", valueText: "text-amber-600"},
    destructive: {text: "text-rose-600", iconBg: "bg-rose-500/10", valueText: "text-rose-600"},
};

export function MetricCard({
                               title,
                               value,
                               icon,
                               variant = "default",
                               children,
                               className
                           }: MetricCardProps) {
    const styles = variantStyles[variant];

    return (
        <div
            className={cn("p-5 rounded-xl border bg-card shadow-sm flex flex-col gap-2 relative overflow-hidden group", className)}>

            {/* Background Watermark Icon */}
            <div
                className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-5 transition-opacity duration-500">
                <HugeIcon name={icon as any} size={100}/>
            </div>

            {/* Top Header & Icon */}
            <div className={cn("flex items-center gap-2 relative z-10", styles.text)}>
                {styles.iconBg ? (
                    <div className={cn("p-1 rounded-md", styles.iconBg)}>
                        <HugeIcon name={icon as any} size={14}/>
                    </div>
                ) : (
                    <HugeIcon name={icon as any} size={14}/>
                )}
                <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
            </div>

            {/* Main Value */}
            <div className={cn("relative z-10", styles.valueText)}>
                {children ? children : (
                    <div className="text-3xl font-black tracking-tighter">
                        {value}
                    </div>
                )}
            </div>

        </div>
    );
}