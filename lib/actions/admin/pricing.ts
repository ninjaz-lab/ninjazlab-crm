"use server";

import {revalidatePath} from "next/cache";
import {randomUUID} from "crypto";
import {asc, desc, eq} from "drizzle-orm";
import {db} from "@/lib/db";
import {pricingRule, user} from "@/lib/db/schema";
import {authenticateAdmin} from "@/lib/actions/session";
import {Routes} from "@/lib/constants/routes";

export async function fetchAllPricingRules() {
    // Validate is Admin
    await authenticateAdmin();

    return db
        .select({
            id: pricingRule.id,
            userId: pricingRule.userId,
            userName: user.name,
            userEmail: user.email,
            userImage: user.image,
            campaign: pricingRule.campaign,
            action: pricingRule.action,
            unitPrice: pricingRule.unitPrice,
            currency: pricingRule.currency,
            effectiveFrom: pricingRule.effectiveFrom,
            note: pricingRule.note,
            createdAt: pricingRule.createdAt,
        })
        .from(pricingRule)
        .leftJoin(user, eq(user.id, pricingRule.userId))
        .orderBy(asc(pricingRule.campaign), asc(pricingRule.action), desc(pricingRule.effectiveFrom));
}

export async function createPricingRule(
    data: {
        userId?: string | null;
        campaign: string;
        action?: string;
        unitPrice: string;
        currency?: string;
        effectiveFrom: Date;
        note?: string;
    }
) {
    // Validate is Admin
    const session = await authenticateAdmin();

    const id = randomUUID();
    await db.insert(pricingRule).values({
        id,
        userId: data.userId ?? null,
        campaign: data.campaign,
        action: data.action ?? "send",
        unitPrice: data.unitPrice,
        currency: data.currency ?? "MYR",
        effectiveFrom: data.effectiveFrom,
        note: data.note ?? null,
        createdBy: session.user.id,
        createdAt: new Date(),
    });
    revalidatePath(Routes.ADMIN_PRICING);
    return id;
}

export async function updatePricingRule(
    id: string,
    data: {
        unitPrice: string;
        effectiveFrom: Date;
        note?: string;
    }
) {
    // Validate is Admin
    await authenticateAdmin();

    await db.update(pricingRule).set({
        unitPrice: data.unitPrice,
        effectiveFrom: data.effectiveFrom,
        note: data.note ?? null,
    }).where(eq(pricingRule.id, id));

    revalidatePath(Routes.ADMIN_PRICING);
}

export async function deletePricingRule(id: string) {
    // Validate is Admin
    await authenticateAdmin();

    await db.delete(pricingRule).where(eq(pricingRule.id, id));
    revalidatePath(Routes.ADMIN_PRICING);
}
