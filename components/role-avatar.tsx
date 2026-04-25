"use client";

import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {HugeIcon} from "@/components/huge-icon";
import {USER_ROLES} from "@/lib/enums";
import {cn} from "@/lib/utils/utils";

interface Props {
    src?: string | null;
    name: string;
    role?: string;
    className?: string;
}

export function RoleAvatar({src, name, role, className}: Props) {
    const renderBadge = () => {
        // Superadmin: Amber Crown Icon
        if (role === USER_ROLES.SUPERADMIN) {
            return (
                <div
                    className="absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center bg-amber-500 rounded-full border-2 border-background shadow-sm"
                    title="Superadmin">
                    <HugeIcon name="CrownIcon" size={10} className="text-white"/>
                </div>
            );
        }

        // Admin: Rose Shield Icon
        if (role === USER_ROLES.ADMIN) {
            return (
                <div
                    className="absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center bg-rose-600 rounded-full border-2 border-background shadow-sm"
                    title="Admin">
                    <HugeIcon name="Shield02Icon" size={10} className="text-white"/>
                </div>
            );
        }

        // Default User: Slate User Icon
        return (
            <div
                className="absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center bg-slate-700 rounded-full border-2 border-background shadow-sm"
                title="User">
                <HugeIcon name="UserIcon" size={10} className="text-white "/>
            </div>
        );
    };

    return (
        <div className={cn("relative h-10 w-10 shrink-0", className)}>
            <Avatar
                className="h-full w-full border-2 border-background shadow-sm group-hover:border-primary/20 transition-all">
                <AvatarImage src={src || undefined} alt={name}/>
                <AvatarFallback className="bg-primary/5 text-primary font-bold">
                    {name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
            </Avatar>
            {renderBadge()}
        </div>
    );
}
