/**
 * Pricing resolution utility.
 *
 * Resolution order at charge time:
 *   1. Most recent user-specific rule where effectiveFrom <= now
 *   2. Fallback to most recent default rule (userId IS NULL) where effectiveFrom <= now
 *
 * Returns unit price as a number, or null if no rule exists.
 */

import { db } from "@/lib/db";
import { pricingRule, userAccount, accountTransaction } from "@/lib/db/schema";
import { and, eq, isNull, lte, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function resolveUnitPrice(
  userId: string,
  module: string,
  action = "send"
): Promise<number | null> {
  const now = new Date();

  // 1. User-specific rule
  const [userRule] = await db
    .select({ unitPrice: pricingRule.unitPrice })
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

  if (userRule) return Number(userRule.unitPrice);

  // 2. Default rule
  const [defaultRule] = await db
    .select({ unitPrice: pricingRule.unitPrice })
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

  if (defaultRule) return Number(defaultRule.unitPrice);

  return null;
}

/**
 * Deduct from a user's balance for a campaign send.
 * Creates a debit transaction record.
 * Returns the amount deducted (negative number) or 0 if no pricing configured.
 */
export async function chargeForSend(params: {
  userId: string;
  module: string;
  units: number;
  referenceId: string;
  note?: string;
}): Promise<number> {
  const { userId, module, units, referenceId, note } = params;

  if (units <= 0) return 0;

  const unitPrice = await resolveUnitPrice(userId, module);
  if (unitPrice === null || unitPrice === 0) return 0;

  const amount = -(units * unitPrice);
  const amountStr = amount.toFixed(2);

  await db.transaction(async (tx) => {
    await tx.insert(accountTransaction).values({
      id: randomUUID(),
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

    await tx
      .update(userAccount)
      .set({
        balance: sql`${userAccount.balance} + ${amountStr}`,
        updatedAt: new Date(),
      })
      .where(eq(userAccount.userId, userId));
  });

  return amount;
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
  if (unitPrice === null) return { unitPrice: null, total: null };
  return { unitPrice, total: units * unitPrice };
}
