"use client";

import {useEffect} from "react";
import {useAppStore} from "@/lib/store/store";
import {markAllNotificationsAsRead} from "@/lib/actions/notification";
import {Bell, CheckCircle2, ExternalLink, XCircle} from "lucide-react";
import Link from "next/link";
import {cn} from "@/lib/utils";
import {formatDistanceToNow} from "date-fns";

type NotificationData = {
    id: string;
    type: string;
    title: string;
    message: string;
    actionUrl: string | null;
    readAt: Date | null;
    createdAt: Date;
};

interface Props {
    initialNotifications: NotificationData[];
}

export function NotificationClient({ initialNotifications = [] }: Props) {
    const clearUnread = useAppStore((state) => state.clearUnread);

    // On mount, clear the Zustand badge and mark them read in the database
    useEffect(() => {
        const hasUnread = initialNotifications.some(n => !n.readAt);

        if (hasUnread) {
            clearUnread(); // Instantly clears the sidebar badge
            markAllNotificationsAsRead(); // Updates the database in the background
        }
    }, [initialNotifications, clearUnread]);

    if (initialNotifications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border rounded-xl bg-card border-dashed">
                <Bell className="size-12 text-muted-foreground/50 mb-4"/>
                <h3 className="text-lg font-semibold">You're all caught up!</h3>
                <p className="text-muted-foreground text-sm mt-1">
                    You have no new notifications right now.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {initialNotifications.map((notif) => {
                const isUnread = !notif.readAt;

                // Determine icon based on the notification type
                let Icon = Bell;
                let iconColor = "text-muted-foreground";
                let bgColor = "bg-muted/50";

                if (notif.type === "import_success") {
                    Icon = CheckCircle2;
                    iconColor = "text-green-600 dark:text-green-500";
                    bgColor = "bg-green-50 dark:bg-green-500/10";
                } else if (notif.type === "import_failed") {
                    Icon = XCircle;
                    iconColor = "text-red-600 dark:text-red-500";
                    bgColor = "bg-red-50 dark:bg-red-500/10";
                }

                return (
                    <div
                        key={notif.id}
                        className={cn(
                            "relative flex items-start gap-4 p-5 rounded-xl border transition-all duration-200 hover:shadow-sm",
                            isUnread ? "bg-background shadow-sm border-primary/20" : "bg-muted/20 border-border"
                        )}
                    >
                        {/* Unread dot indicator */}
                        {isUnread && (
                            <div className="absolute top-6 left-2.5 size-2 rounded-full bg-primary"/>
                        )}

                        <div className={cn("flex-shrink-0 p-2.5 rounded-full ml-2", bgColor)}>
                            <Icon className={cn("size-5", iconColor)}/>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-4 mb-1">
                                <h4 className={cn("text-base font-semibold", isUnread ? "text-foreground" : "text-muted-foreground")}>
                                    {notif.title}
                                </h4>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatDistanceToNow(new Date(notif.createdAt), {addSuffix: true})}
                                </span>
                            </div>

                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {notif.message}
                            </p>

                            {notif.actionUrl && (
                                <div className="mt-3">
                                    <Link
                                        href={notif.actionUrl}
                                        className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                                    >
                                        View details <ExternalLink className="ml-1.5 size-3"/>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}