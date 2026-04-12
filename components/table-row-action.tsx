import {cn} from "@/lib/utils/utils";
import {HugeIcon} from "@/components/huge-icon";
import React from "react";

interface TableRowActionProps extends React.HTMLAttributes<HTMLDivElement> {
    iconName?: string;
}

export function TableRowAction({
                                   iconName = "ArrowUpRight01Icon",
                                   className,
                                   ...props
                               }: TableRowActionProps) {
    return (
        <div
            className={cn(
                "size-8 rounded-full bg-muted/30 group-hover:bg-primary/10 flex items-center justify-center transition-all ml-auto",
                className
            )}
            {...props}
        >
            <HugeIcon
                name={iconName}
                size={16}
                className="text-muted-foreground group-hover:text-primary transition-all"
            />
        </div>
    );
}