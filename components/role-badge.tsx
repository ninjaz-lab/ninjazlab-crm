"use client";

import {Badge} from "@/components/ui/badge";
import {USER_ROLES} from "@/lib/enums";
import {cn} from "@/lib/utils/utils";

interface RoleBadgeProps {
    role: string | undefined;
    className?: string;
}

export function RoleBadge({role, className}: RoleBadgeProps) {
    const isAdmin = role?.toUpperCase() === USER_ROLES.ADMIN.toUpperCase();

    return (
        <Badge
            className={cn(
                "font-black uppercase text-[10px] tracking-tighter px-2 py-0.5 shadow-none border-none",
                isAdmin
                    ? "bg-destructive hover:bg-destructive/80"
                    : "bg-primary/10 text-primary hover:bg-primary/20",
                className
            )}
        >
            {role || "Unknown"}
        </Badge>
    );
}
