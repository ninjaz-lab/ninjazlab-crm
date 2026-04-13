"use client";

import * as React from "react";
import {HugeiconsIcon} from "@hugeicons/react";
import * as AllIcons from "@hugeicons/core-free-icons";
import {cn} from "@/lib/utils";

interface HugeIconProps extends Omit<React.ComponentProps<typeof HugeiconsIcon>, "icon"> {
    name: string;
    variant?: "stroke" | "solid" | "bulk" | "duotone";
}

export function HugeIcon({
                             name,
                             className,
                             size = 24,
                             variant = "stroke",
                             ...props
                         }: HugeIconProps) {
    const iconLibrary = AllIcons as Record<string, any>;
    const iconData = iconLibrary[name];

    if (!iconData) {
        return (
            <HugeiconsIcon
                {...props}
                icon={AllIcons.HelpCircleIcon}
                size={size}
                className={cn("text-muted-foreground", className)}
            />
        );
    }

    return (
        <HugeiconsIcon
            icon={iconData}
            size={size}
            className={cn(className)}
            {...props}
        />
    );
}