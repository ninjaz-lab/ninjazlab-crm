"use server";

import {db} from "@/lib/db";
import {marketingProvider, user} from "@/lib/db/schema";
import {and, desc, eq, isNull} from "drizzle-orm";
import {revalidatePath} from "next/cache";
import {Routes} from "@/lib/constants/routes";

export async function fetchTenants() {
    return db.select(
        {
            id: marketingProvider.id,
            userId: marketingProvider.userId,
            channel: marketingProvider.channel,
            name: marketingProvider.name,
            config: marketingProvider.config,
            isDefault: marketingProvider.isDefault,
            updatedAt: marketingProvider.updatedAt,
            userName: user.name,
            userImage: user.image,
        })
        .from(marketingProvider)
        .leftJoin(user, eq(marketingProvider.userId, user.id))
        .orderBy(
            desc(marketingProvider.isDefault),
            desc(marketingProvider.createdAt)
        );
}

export async function fetchProviderConfig(
    userId: string | null,
    channel: string
) {
    const query = userId
        ? and(eq(marketingProvider.userId, userId), eq(marketingProvider.channel, channel))
        : and(isNull(marketingProvider.userId), eq(marketingProvider.channel, channel), eq(marketingProvider.isDefault, true));

    const [provider] = await db.select().from(marketingProvider).where(query).limit(1);
    return provider || null;
}

export async function createProviderConfig(
    data: {
        userId: string | null;
        channel: string;
        name: string;
        config: any;
    }
) {
    await db.insert(marketingProvider).values({
        userId: data.userId,
        channel: data.channel,
        name: data.name,
        config: data.config,
        isDefault: data.userId === null, // Auto-sets global flag if no user is selected
    });

    revalidatePath(Routes.ADMIN_PROVIDERS);
}

export async function updateProviderConfig(
    id: string,
    data: {
        userId: string | null;
        channel: string;
        name: string;
        config: any;
    }
) {
    await db.update(marketingProvider)
        .set({
            userId: data.userId,
            channel: data.channel,
            name: data.name,
            config: data.config,
            isDefault: data.userId === null,
            updatedAt: new Date()
        })
        .where(eq(marketingProvider.id, id));

    revalidatePath(Routes.ADMIN_PROVIDERS);
}

export async function deleteProviderConfig(providerId: string) {
    await db.delete(marketingProvider)
        .where(eq(marketingProvider.id, providerId));

    revalidatePath(Routes.ADMIN_PROVIDERS);
}
