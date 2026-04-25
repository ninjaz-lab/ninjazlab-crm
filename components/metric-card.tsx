"use client";

import {cn} from "@/lib/utils/utils";
import {HugeIcon} from "@/components/huge-icon";
import React from "react";
import Link from "next/link";

export type MetricCardVariant = "default" | "primary" | "success" | "warning" | "destructive";

interface Props {
    title: string;
    value?: string | number;
    icon: string;
    variant?: MetricCardVariant;
    children?: React.ReactNode;
    className?: string;
    href?: string;
}

const variantStyles: Record<MetricCardVariant, {
    text: string;
    iconBg?: string;
    valueText?: string;
    hoverEffect?: string;
}> = {
    default: {
        text: "text-muted-foreground",
        valueText: "text-foreground",
        hoverEffect: "hover:border-primary/30 hover:shadow-lg"
    },
    primary: {
        text: "text-primary",
        iconBg: "bg-primary/10",
        valueText: "text-primary",
        hoverEffect: "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
    },
    success: {
        text: "text-emerald-600",
        iconBg: "bg-emerald-500/10",
        valueText: "text-emerald-600",
        hoverEffect: "hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10"
    },
    warning: {
        text: "text-amber-600",
        iconBg: "bg-amber-500/10",
        valueText: "text-amber-600",
        hoverEffect: "hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10"
    },
    destructive: {
        text: "text-rose-600",
        iconBg: "bg-rose-500/10",
        valueText: "text-rose-600",
        hoverEffect: "hover:border-rose-500/40 hover:shadow-lg hover:shadow-rose-500/10"
    },
};

export function MetricCard({title, value, icon, variant = "default", children, className, href}: Props) {
    const styles = variantStyles[variant];

    const innerContent = (
        <>
            {/* Background Watermark Icon */}
            <div
                className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-10 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                <HugeIcon name={icon as any} size={100}/>
            </div>

            {/* Top Header & Icon */}
            <div className={cn("flex items-center gap-2 relative z-10 transition-colors duration-300", styles.text)}>
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
            <div className={cn("relative z-10 transition-colors duration-300", styles.valueText)}>
                {children ? children : (
                    <div className="text-3xl font-black tracking-tighter">
                        {value}
                    </div>
                )}
            </div>
        </>
    );

    const cardClasses = cn(
        "p-5 rounded-xl border bg-card shadow-sm flex flex-col gap-2 relative overflow-hidden group",
        "transform translate-y-0 transition-all duration-300 ease-out hover:-translate-y-2 hover:z-20",
        href && "cursor-pointer",
        styles.hoverEffect,
        className
    );

    if (href) {
        return (
            <Link href={href}
                  className={cn("block outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2", cardClasses)}
            >
                {innerContent}
            </Link>
        );
    }

    return (
        <div className={cardClasses}>
            {innerContent}
        </div>
    );
}