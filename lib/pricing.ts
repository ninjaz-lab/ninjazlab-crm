import {db} from "@/lib/db";
import {pricingRule, wallets, walletTransaction} from "@/lib/db/schema";
import {and, desc, eq, isNull, lte, sql} from "drizzle-orm";
import {randomUUID} from "crypto";
import {WALLET_TYPES} from "@/lib/enums";

export async function resolveUnitPrice(
    userId: string,
    module: string,
    action = "send"
): Promise<number | null> {
    const now = new Date();

    // 1. User-specific rule
    const [userRule] = await db
        .select({unitPrice: pricingRule.unitPrice})
        .from(pricingRule)
        .where(
            and(
                eq(pricingRule.userId, userId),
                eq(pricingRule.module, module),
                eq(pricingRule.action, action),
                lte(pricingRule.effectiveFrom, now)
            )
        )
        .orderBy(desc(pricingRule.effectiveFrom))
        .limit(1);

    if (userRule)
        return Number(userRule.unitPrice);

    // 2. Default rule
    const [defaultRule] = await db
        .select({unitPrice: pricingRule.unitPrice})
        .from(pricingRule)
        .where(
            and(
                isNull(pricingRule.userId),
                eq(pricingRule.module, module),
                eq(pricingRule.action, action),
                lte(pricingRule.effectiveFrom, now)
            )
        )
        .orderBy(desc(pricingRule.effectiveFrom))
        .limit(1);

    if (defaultRule)
        return Number(defaultRule.unitPrice);

    return null;
}

export async function chargeForSend(params: {
    userId: string;
    module: string;
    units: number;
    referenceId: string;
    note?: string;
}): Promise<number> {
    const {userId, module, units, referenceId, note} = params;

    if (units <= 0)
        return 0;

    const unitPrice = await resolveUnitPrice(userId, module);
    if (unitPrice === null || unitPrice === 0)
        return 0;

    const totalCost = units * unitPrice;
    const amountStr = totalCost.toFixed(2);

    await db.transaction(async (tx) => {
        // 1. Find the target wallet
        const [wallet] = await tx
            .select()
            .from(wallets)
            .where(and(eq(wallets.userId, userId), eq(wallets.walletType, WALLET_TYPES.MAIN)))
            .limit(1);

        if (!wallet) throw new Error("User has no main wallet configured.");

        // 2. Record Debit Transaction (Absolute value in 'amount', type 'debit')
        await tx.insert(walletTransaction).values({
            id: randomUUID(),
            walletId: wallet.id,
            userId,
            amount: amountStr,
            type: "debit",
            module,
            referenceId,
            unitCost: unitPrice.toFixed(6),
            units,
            note: note ?? `${module} — ${units} units`,
            createdAt: new Date(),
        });

        // 3. Update the actual balance
        await tx
            .update(wallets)
            .set({
                balance: sql`${wallets.balance}
                -
                ${amountStr}`,
                updatedAt: new Date(),
            })
            .where(eq(wallets.id, wallet.id));
    });

    return -totalCost;
}

/**
 * Preview cost before sending — doesn't write anything.
 */
export async function previewCost(
    userId: string,
    module: string,
    units: number
): Promise<{ unitPrice: number | null; total: number | null }> {
    const unitPrice = await resolveUnitPrice(userId, module);
    if (unitPrice === null) return {unitPrice: null, total: null};
    return {unitPrice, total: units * unitPrice};
}
