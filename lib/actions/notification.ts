"use server";

import {and, count, desc, eq} from "drizzle-orm";
import {db} from "@/lib/db";
import {notification, user} from "@/lib/db/schema";
import {getSession} from "@/lib/session";
import {USER_ROLES} from "@/lib/enums";
import {revalidatePath} from "next/cache";

export async function fetchUnreadNotificationCount() {
    const session = await getSession();
    if (!session || !session.user) return 0;

    const [result] = await db
        .select({total: count()})
        .from(notification)
        .where(
            and(
                eq(notification.userId, session.user.id),
                eq(notification.isRead, false)
            )
        );

    return result.total;
}

export async function fetchAllNotifications() {
    const session = await getSession();
    if (!session || !session.user) return [];

    return await db
        .select()
        .from(notification)
        .where(eq(notification.userId, session.user.id))
        .orderBy(desc(notification.createdAt))
        .limit(50);
}

export async function markNotificationAsRead(id: string) {
    const session = await getSession();
    if (!session || !session.user) return;

    await db
        .update(notification)
        .set({isRead: true})
        .where(
            and(
                eq(notification.id, id),
                eq(notification.userId, session.user.id)
            )
        );

    revalidatePath("/", "layout");
}

export async function markAllNotificationsAsRead() {
    const session = await getSession();
    if (!session || !session.user) return 0;

    const results = await db
        .update(notification)
        .set({isRead: true})
        .where(
            and(
                eq(notification.userId, session.user.id),
                eq(notification.isRead, false)
            )
        );
    revalidatePath("/", "layout");

    return results;
}

export async function clearNotification(id: string) {
    const session = await getSession();
    if (!session || !session.user) return;

    await db.delete(notification).where(
        and(
            eq(notification.id, id),
            eq(notification.userId, session.user.id)
        )
    );
    revalidatePath("/", "layout");
}

export async function clearAllNotifications() {
    const session = await getSession();
    if (!session || !session.user) return;

    await db.delete(notification).where(
        eq(notification.userId, session.user.id)
    );
    revalidatePath("/", "layout");
}

/**
 * Sends an in-app notification to a specific user.
 */
export async function notifyUser(
    userId: string,
    type: string,
    title: string,
    message: string,
    actionUrl?: string
) {
    await db.insert(notification).values({
        userId,
        type,
        title,
        message,
        actionUrl,
        createdAt: new Date(),
    });
}

/**
 * Broadcasts an in-app notification to all system administrators.
 */
export async function notifyAdmins(
    type: string,
    title: string,
    message: string,
    actionUrl?: string
) {
    const adminUsers = await db.select({id: user.id})
        .from(user)
        .where(eq(user.role, USER_ROLES.ADMIN));

    if (adminUsers.length === 0) return;

    const payloads = adminUsers.map((admin) => ({
        userId: admin.id,
        type,
        title,
        message,
        actionUrl,
        createdAt: new Date(),
    }));

    await db.insert(notification).values(payloads);
}
