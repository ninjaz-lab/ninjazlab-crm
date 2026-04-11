"use client";

import {Bell} from "lucide-react";
import {Button} from "@/components/ui/button";
import {useAppStore} from "@/lib/store/app-store";

export function NotificationBell() {
    // The component manages its own state by subscribing to the store directly
    const {unreadNotifications} = useAppStore();

    return (
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="size-[1.2rem]"/>
            {unreadNotifications > 0 && (
                <span
                    className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
            )}
        </Button>
    );
}