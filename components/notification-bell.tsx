"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {HugeIcon} from "@/components/huge-icon";
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger} from "@/components/ui/sheet";
import {fetchUnreadNotificationCount} from "@/lib/actions/notification";
import {NotificationPanel} from "./notification-panel";
import {cn} from "@/lib/utils/utils";
import {createClient} from "@/lib/utils/supabase/client";

export function NotificationBell({userId}: { userId: string }) {
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [supabase] = useState(() => createClient());

    const isOpenRef = useRef(isOpen);
    useEffect(() => {
        isOpenRef.current = isOpen;
    }, [isOpen]);

    const playNotificationSound = useCallback(() => {
        if (typeof window !== "undefined") {
            const audio = new Audio('/notification.mp3');
            audio.play().catch((err) => {
                console.log("Browser blocked auto-play sound. User must interact with the page first.", err);
            });
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        let debounceTimer: NodeJS.Timeout;

        const syncCount = async () => {
            const count = await fetchUnreadNotificationCount();
            if (isMounted) setUnreadCount(count);
        };
        void syncCount();

        const uniqueChannelName = `realtime-alerts-${userId}-${Math.random().toString(36).substring(7)}`;
        const channel = supabase
            .channel(uniqueChannelName)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notification',
            }, () => {
                // 1. Instantly update the red badge number
                setUnreadCount((prev) => prev + 1);

                // 2. Play the sound INSTEAD of the toast!
                playNotificationSound();

                // 3. If panel is open, silently fetch the new data
                if (isOpenRef.current) {
                    setRefreshTrigger(prev => prev + 1);
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'notification',
            }, () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    void syncCount();
                    if (isOpenRef.current) setRefreshTrigger(prev => prev + 1);
                }, 500);
            })
            .on('postgres_changes', {
                event: 'DELETE',
                schema: 'public',
                table: 'notification',
            }, () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    void syncCount();
                    if (isOpenRef.current) setRefreshTrigger(prev => prev + 1);
                }, 500);
            })
            .subscribe((status, err) => {
                console.log("📡 Supabase Realtime Status:", status, err);
            });

        return () => {
            isMounted = false;
            clearTimeout(debounceTimer);

            void supabase.removeChannel(channel);
        };
    }, [supabase, userId, playNotificationSound]);

    const handleAction = useCallback(() => setIsOpen(false), []);
    const handleMarkAllRead = useCallback(() => setUnreadCount(0), []);
    const handleDecrementCount = useCallback(() => setUnreadCount(prev => Math.max(0, prev - 1)), []);

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <button
                    className="relative flex items-center justify-center p-2 rounded-full hover:bg-muted transition-colors outline-none cursor-pointer">
                    <HugeIcon name="Notification01Icon" size={20}
                              className="text-muted-foreground hover:text-foreground"/>
                    {unreadCount > 0 && (
                        <span
                            className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-background">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>
            </SheetTrigger>
            <SheetContent
                className={cn(
                    "w-full p-0 flex flex-col border-l shadow-2xl transition-all duration-300",
                    "md:w-[25vw] md:max-w-none lg:w-[25vw]"
                )}
            >
                <SheetHeader className="p-4 border-b">
                    <SheetTitle className="text-lg font-semibold">Notifications</SheetTitle>
                </SheetHeader>
                <NotificationPanel
                    userId={userId}
                    onAction={handleAction}
                    onMarkAllRead={handleMarkAllRead}
                    onDecrementCount={handleDecrementCount}
                    refreshTrigger={refreshTrigger}
                />
            </SheetContent>
        </Sheet>
    );
}