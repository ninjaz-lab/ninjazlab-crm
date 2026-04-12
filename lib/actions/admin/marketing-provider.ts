"use server";

import {marketingProvider} from "@/lib/db/schema";
import {and, eq, isNull} from "drizzle-orm";
import {db} from "@/lib/db";
import {revalidatePath} from "next/cache";
import {authenticateAdmin} from "@/lib/actions/session";

export async function fetchMarketingProviders(channel?: string) {
    // Validate is Admin
    await authenticateAdmin();

    const conditions = [isNull(marketingProvider.userId)];
    if (channel)
        conditions.push(eq(marketingProvider.channel, channel));

    return db
        .select()
        .from(marketingProvider)
        .where(and(...conditions))
        .orderBy(marketingProvider.createdAt);
}

export async function createMarketingProvider(data: {
    channel: string;
    name: string;
    type: "ses" | "smtp" | "resend";
    config: Record<string, string>;
    isDefault?: boolean;
}) {
    // Validate is Admin
    await authenticateAdmin();

    const {randomUUID} = await import("crypto");

    // If setting as default, unset existing defaults for this channel
    if (data.isDefault)
        await db
            .update(marketingProvider)
            .set({isDefault: false})
            .where(
                and(isNull(marketingProvider.userId), eq(marketingProvider.channel, data.channel))
            );

    const id = randomUUID();
    await db.insert(marketingProvider).values({
        id,
        userId: null,
        channel: data.channel,
        name: data.name,
        config: {type: data.type, ...data.config},
        isDefault: data.isDefault ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    revalidatePath("/admin/settings");
    return id;
}

export async function deleteMarketingProvider(id: string) {
    // Validate is Admin
    await authenticateAdmin();

    await db
        .delete(marketingProvider)
        .where(and(eq(marketingProvider.id, id), isNull(marketingProvider.userId)));

    revalidatePath("/admin/settings");
}

export async function setMarketingProvider(
    id: string,
    channel: string
) {
    // Validate is Admin
    await authenticateAdmin();

    await db
        .update(marketingProvider)
        .set({isDefault: false})
        .where(
            and(isNull(marketingProvider.userId), eq(marketingProvider.channel, channel))
        );
    await db
        .update(marketingProvider)
        .set({isDefault: true, updatedAt: new Date()})
        .where(eq(marketingProvider.id, id));

    revalidatePath("/admin/settings");
}
