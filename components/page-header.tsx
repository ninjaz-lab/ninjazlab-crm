import {cn} from "@/lib/utils/utils";
import React from "react";

interface PageHeaderProps {
    title: string;
    description: string;
    tag?: string;
    tagClassName?: string;
    children?: React.ReactNode;
    className?: string;
}

export function PageHeader({
                               title,
                               description,
                               tag,
                               tagClassName = "text-primary",
                               children,
                               className
                           }: PageHeaderProps) {
    return (
        <div className={cn("flex items-end justify-between border-b pb-4", className)}>
            <div className="space-y-0.5">
                <h1 className="text-xl font-black tracking-tight uppercase">
                    {title}
                </h1>
                <p className="text-xs font-medium text-muted-foreground">
                    {description}
                </p>
            </div>

            {(tag || children) && (
                <div className="flex items-center gap-3 shrink-0">
                    {tag && (
                        <span className={cn("uppercase font-black tracking-widest text-[9px]", tagClassName)}>
                            {tag}
                        </span>
                    )}

                    {children && (
                        <div className="flex items-center gap-2">
                            {children}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
