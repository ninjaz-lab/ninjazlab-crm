"use server";

import {and, count, desc, eq, isNull} from "drizzle-orm";
import {db} from "@/lib/db";
import {notification} from "@/lib/db/schema";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";

async function getSession() {
    const session = await auth.api.getSession({headers: await headers()});
    if (!session) throw new Error("Unauthorized");
    return session;
}

export async function getUnreadNotificationCount() {
    const session = await getSession();

    const [result] = await db
        .select({total: count()})
        .from(notification)
        .where(
            and(
                eq(notification.userId, session.user.id),
                isNull(notification.readAt)
            )
        );

    return result.total;
}

export async function getNotifications() {
    const session = await getSession();

    return await db
        .select()
        .from(notification)
        .where(eq(notification.userId, session.user.id))
        .orderBy(desc(notification.createdAt))
        .limit(50);
}

export async function markAllNotificationsAsRead() {
    const session = await getSession();

    await db
        .update(notification)
        .set({readAt: new Date()})
        .where(
            and(
                eq(notification.userId, session.user.id),
                isNull(notification.readAt)
            )
        );
}