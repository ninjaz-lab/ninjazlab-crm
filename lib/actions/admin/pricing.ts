"use server";

import {revalidatePath} from "next/cache";
import {randomUUID} from "crypto";
import {asc, desc, eq} from "drizzle-orm";
import {db} from "@/lib/db";
import {pricingRule, user} from "@/lib/db/schema";
import {authenticateAdmin} from "@/lib/actions/session";
import {Routes} from "@/lib/constants/routes";
import {
    AdminActionError,
    ADMIN_ERROR_CODES,
    validateExists,
    executeAdminAction,
    validateCondition
} from "@/lib/actions/admin/error-handler";

/**
 * Fetch all pricing rules with user information
 * @throws AdminActionError if authentication fails or database query fails
 */
export async function fetchAllPricingRules() {
    return executeAdminAction(async () => {
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
    }, "Failed to fetch pricing rules");
}

/**
 * Create a new pricing rule
 * @param data - Pricing rule data
 * @returns ID of the created pricing rule
 * @throws AdminActionError if validation fails
 */
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
    return executeAdminAction(async () => {
        const session = await authenticateAdmin();

        // Validate required fields
        validateCondition(!!data.campaign, "Campaign is required", ADMIN_ERROR_CODES.INVALID_INPUT);
        validateCondition(!!data.unitPrice, "Unit price is required", ADMIN_ERROR_CODES.INVALID_INPUT);

        // Validate unitPrice is a valid decimal number
        const price = parseFloat(data.unitPrice);
        validateCondition(
            !isNaN(price) && price >= 0,
            "Unit price must be a valid positive number",
            ADMIN_ERROR_CODES.INVALID_PRICE
        );

        // If userId is provided, validate user exists
        if (data.userId) {
            const [targetUser] = await db.select()
                .from(user)
                .where(eq(user.id, data.userId))
                .limit(1);
            validateExists(targetUser, "User", data.userId);
        }

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
    }, "Failed to create pricing rule");
}

/**
 * Update an existing pricing rule
 * @param id - Pricing rule ID
 * @param data - Updated pricing rule data
 * @throws AdminActionError if rule not found or validation fails
 */
export async function updatePricingRule(
    id: string,
    data: {
        unitPrice: string;
        effectiveFrom: Date;
        note?: string;
    }
) {
    return executeAdminAction(async () => {
        await authenticateAdmin();

        // Validate input
        validateCondition(!!id, "Pricing rule ID is required", ADMIN_ERROR_CODES.INVALID_INPUT);
        validateCondition(!!data.unitPrice, "Unit price is required", ADMIN_ERROR_CODES.INVALID_INPUT);

        // Validate unitPrice is a valid decimal number
        const price = parseFloat(data.unitPrice);
        validateCondition(
            !isNaN(price) && price >= 0,
            "Unit price must be a valid positive number",
            ADMIN_ERROR_CODES.INVALID_PRICE
        );

        // Check rule exists
        const [existingRule] = await db.select()
            .from(pricingRule)
            .where(eq(pricingRule.id, id))
            .limit(1);
        validateExists(existingRule, "Pricing rule", id);

        await db.update(pricingRule).set({
            unitPrice: data.unitPrice,
            effectiveFrom: data.effectiveFrom,
            note: data.note ?? null,
        }).where(eq(pricingRule.id, id));

        revalidatePath(Routes.ADMIN_PRICING);
    }, "Failed to update pricing rule");
}

/**
 * Delete a pricing rule
 * @param id - Pricing rule ID
 * @throws AdminActionError if rule not found
 */
export async function deletePricingRule(id: string) {
    return executeAdminAction(async () => {
        await authenticateAdmin();

        // Validate input
        validateCondition(!!id, "Pricing rule ID is required", ADMIN_ERROR_CODES.INVALID_INPUT);

        // Check rule exists
        const [existingRule] = await db.select()
            .from(pricingRule)
            .where(eq(pricingRule.id, id))
            .limit(1);
        validateExists(existingRule, "Pricing rule", id);

        await db.delete(pricingRule).where(eq(pricingRule.id, id));
        revalidatePath(Routes.ADMIN_PRICING);
    }, "Failed to delete pricing rule");
}
