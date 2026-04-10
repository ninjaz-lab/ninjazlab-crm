import {getNotifications} from "@/lib/actions/notification";
import {NotificationClient} from "./_components/notification-client";

export default async function NotificationsPage() {
    // Fetch notifications on the server
    const notifications = await getNotifications();

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                <p className="text-muted-foreground mt-2">
                    View your recent system alerts and updates.
                </p>
            </div>

            <NotificationClient initialNotifications={notifications}/>
        </div>
    );
}