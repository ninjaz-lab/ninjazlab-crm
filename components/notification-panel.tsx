"use client";

import {useEffect, useState} from "react";
import {
    clearAllNotifications,
    clearNotification,
    fetchAllNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead
} from "@/lib/actions/notification";
import {formatDistanceToNow} from "date-fns";
import {HugeIcon} from "@/components/huge-icon";
import {ScrollArea} from "@/components/ui/scroll-area";
import {cn} from "@/lib/utils/utils";
import {useRouter} from "next/navigation";

export function NotificationPanel({userId, onAction, onMarkAllRead, onDecrementCount, refreshTrigger}: {
    userId: string,
    onAction: () => void,
    onMarkAllRead: () => void,
    onDecrementCount: () => void,
    refreshTrigger: number
}) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;

        async function load() {
            if (notifications.length === 0)
                setLoading(true);
            
            const data = await fetchAllNotifications();
            if (!isMounted) return;
            setNotifications(data);
            setLoading(false);
        }

        void load();
        return () => {
            isMounted = false;
        };
    }, [refreshTrigger]);

    const handleMarkAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({...n, isRead: true})));
        onMarkAllRead();
        await markAllNotificationsAsRead();
    };

    const handleClearAll = async () => {
        setNotifications([]); // Instantly empty UI
        onMarkAllRead();      // Clear the red badge on the bell
        await clearAllNotifications(); // Delete from DB
    };

    const handleNotificationClick = async (n: any) => {
        if (!n.isRead) {
            setNotifications(prev => prev.map(item => item.id === n.id ? {...item, isRead: true} : item));
            onDecrementCount();
            await markNotificationAsRead(n.id);
        }
        if (n.actionUrl) {
            router.push(n.actionUrl);
            onAction();
        }
    };

    const handleClearSingle = async (e: React.MouseEvent, n: any) => {
        e.stopPropagation(); // 🚩 Prevents the card click from triggering when clicking the X
        setNotifications(prev => prev.filter(item => item.id !== n.id));
        if (!n.isRead) onDecrementCount();
        await clearNotification(n.id);
    };

    if (loading)
        return <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">Loading alerts...</div>;

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden w-full">

            {/* Always-Visible Modern Action Bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30 shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Inbox
                </span>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleMarkAllAsRead}
                        disabled={notifications.every(n => n.isRead)}
                        className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <HugeIcon name="CheckmarkBadge01Icon" size={14}/> Read all
                    </button>
                    <button
                        onClick={handleClearAll}
                        disabled={notifications.length === 0}
                        className="text-xs font-semibold text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <HugeIcon name="Delete02Icon" size={14}/> Clear all
                    </button>
                </div>
            </div>

            <ScrollArea className="flex-1 min-h-0 w-full">
                {notifications.length === 0 ? (
                    <div
                        className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground opacity-70">
                        <HugeIcon name="Notification01Icon" size={40} className="mb-3 opacity-20"/>
                        <span className="text-sm font-medium">You're all caught up!</span>
                        <span className="text-xs mt-1">No new notifications.</span>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {notifications.map((n) => (
                            <div key={n.id}
                                 onClick={() => handleNotificationClick(n)}
                                 className={cn(
                                     "group relative flex items-start gap-3 p-4 border-b last:border-b-0 transition-all cursor-pointer",
                                     !n.isRead ? "bg-primary/5 hover:bg-primary/10" : "bg-transparent hover:bg-muted/40"
                                 )}>

                                {!n.isRead && (
                                    <div
                                        className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full shadow-[2px_0_8px_rgba(0,0,0,0.1)]"/>
                                )}

                                <div className={cn(
                                    "mt-0.5 p-2 rounded-full border shrink-0 flex items-center justify-center",
                                    n.type === 'billing_alert' ? "bg-rose-100/50 border-rose-200 text-rose-600" : "bg-primary/10 border-primary/20 text-primary"
                                )}>
                                    <HugeIcon
                                        name={n.type === 'billing_alert' ? "CreditCardIcon" : "Notification02Icon"}
                                        size={16}/>
                                </div>

                                <div className="flex-1 min-w-0 pr-6">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className={cn(
                                            "text-sm pr-2 leading-tight",
                                            !n.isRead ? "font-bold text-foreground" : "font-semibold text-foreground/80"
                                        )}>
                                            {n.title}
                                        </h4>
                                        <span
                                            className="text-[10px] font-medium text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                                            {formatDistanceToNow(new Date(n.createdAt), {addSuffix: true})}
                                        </span>
                                    </div>

                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                                        {n.message}
                                    </p>

                                    {n.actionUrl && (
                                        <div
                                            className="mt-2 text-[11px] font-bold text-primary flex items-center gap-1 group-hover:underline w-max">
                                            View details <HugeIcon name="ArrowRight01Icon" size={12}/>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={(e) => handleClearSingle(e, n)}
                                    title="Clear notification"
                                    className="absolute top-3 right-2 p-1.5 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <HugeIcon name="Cancel01Icon" size={14}/>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}