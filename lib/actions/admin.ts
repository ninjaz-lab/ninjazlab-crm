"use server";

import {db} from "@/lib/db";
import {
    accountTransaction,
    appModule,
    marketingProvider,
    pricingRule,
    user,
    userAccount,
    userPermission
} from "@/lib/db/schema";
import {and, asc, desc, eq, isNull, sql} from "drizzle-orm";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {revalidatePath} from "next/cache";
import {randomUUID} from "crypto";

async function requireAdmin() {
    const session = await auth.api.getSession({headers: await headers()});
    if (!session || session.user.role !== "admin")
        throw new Error("Unauthorized");

    return session;
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function getAllUsers() {
    await requireAdmin();
    return db.select().from(user).orderBy(user.createdAt);
}

export async function setUserRole(userId: string, role: "user" | "admin") {
    await requireAdmin();
    await db
        .update(user)
        .set({role, updatedAt: new Date()})
        .where(eq(user.id, userId));
    revalidatePath("/admin/users");
}

export async function banUser(userId: string, reason: string) {
    await requireAdmin();
    await db
        .update(user)
        .set({banned: true, banReason: reason, updatedAt: new Date()})
        .where(eq(user.id, userId));
    revalidatePath("/admin/users");
}

export async function unbanUser(userId: string) {
    await requireAdmin();
    await db
        .update(user)
        .set({banned: false, banReason: null, updatedAt: new Date()})
        .where(eq(user.id, userId));
    revalidatePath("/admin/users");
}

// ── Accounts ───────────────────────────────────────────────────────────────

export async function getAllAccounts() {
    await requireAdmin();
    return db
        .select({
            id: userAccount.id,
            userId: userAccount.userId,
            balance: userAccount.balance,
            currency: userAccount.currency,
            updatedAt: userAccount.updatedAt,
            name: user.name,
            email: user.email,
            image: user.image,
        })
        .from(userAccount)
        .innerJoin(user, eq(userAccount.userId, user.id));
}

export async function ensureAccount(userId: string) {
    const existing = await db
        .select()
        .from(userAccount)
        .where(eq(userAccount.userId, userId))
        .limit(1);
    if (existing.length === 0) {
        await db.insert(userAccount).values({
            id: randomUUID(),
            userId,
            balance: "0.00",
            currency: "USD",
            updatedAt: new Date(),
        });
    }
}

export async function adjustBalance(
    userId: string,
    amount: number,
    type: "credit" | "debit",
    note: string
) {
    const adminSession = await requireAdmin();
    await ensureAccount(userId);

    const delta = type === "credit" ? amount : -amount;

    await db
        .update(userAccount)
        .set({
            balance: sql`${userAccount.balance}
            +
            ${delta}`,
            updatedAt: new Date(),
        })
        .where(eq(userAccount.userId, userId));

    await db.insert(accountTransaction).values({
        id: randomUUID(),
        userId,
        amount: Math.abs(amount).toFixed(2),
        type,
        note,
        createdAt: new Date(),
        createdBy: adminSession.user.id,
    });

    revalidatePath("/admin/accounts");
}

export async function getTransactions(userId: string) {
    await requireAdmin();
    return db
        .select()
        .from(accountTransaction)
        .where(eq(accountTransaction.userId, userId))
        .orderBy(accountTransaction.createdAt);
}

// ── Permissions ────────────────────────────────────────────────────────────

export async function fetchAllAppModules() {
    await requireAdmin();
    return db.select().from(appModule).orderBy(appModule.title);
}

export async function fetchAllUsersWithPermissions() {
    await requireAdmin();
    const users = await db.select().from(user).where(eq(user.role, "user"));

    // Fetch all dynamic modules and permissions
    const allModules = await db.select().from(appModule);
    const permissions = await db.select().from(userPermission);

    return users.map((u) => {
        // Build a dictionary of { [moduleId]: boolean }
        const perms: Record<string, boolean> = {};

        // Default all to false
        for (const m of allModules)
            perms[m.id] = false;

        // Override with their actual saved permissions
        for (const p of permissions.filter((p) => p.userId === u.id)) {
            perms[p.moduleId] = p.enabled;
        }

        return {...u, permissions: perms};
    });
}

export async function setModulePermission(
    userId: string,
    moduleId: string,
    enabled: boolean
) {
    await requireAdmin();

    const existing = await db
        .select()
        .from(userPermission)
        .where(
            and(
                eq(userPermission.userId, userId),
                eq(userPermission.moduleId, moduleId)
            )
        )
        .limit(1);

    if (existing.length === 0)
        await db.insert(userPermission).values({
            id: randomUUID(),
            userId,
            moduleId,
            enabled,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    else // Update existing permission record
        await db
            .update(userPermission)
            .set({enabled, updatedAt: new Date()})
            .where(
                and(
                    eq(userPermission.userId, userId),
                    eq(userPermission.moduleId, moduleId)
                )
            );

    revalidatePath("/admin/modules");
}

// ── System Marketing Providers (admin-only) ────────────────────────────────

export async function getSystemProviders(channel?: string) {
    await requireAdmin();
    const conditions = [isNull(marketingProvider.userId)];
    if (channel) conditions.push(eq(marketingProvider.channel, channel));
    return db
        .select()
        .from(marketingProvider)
        .where(and(...conditions))
        .orderBy(marketingProvider.createdAt);
}

export async function createSystemProvider(data: {
    channel: string;
    name: string;
    type: "ses" | "smtp" | "resend";
    config: Record<string, string>;
    isDefault?: boolean;
}) {
    await requireAdmin();
    const {randomUUID} = await import("crypto");

    // If setting as default, unset existing defaults for this channel
    if (data.isDefault) {
        await db
            .update(marketingProvider)
            .set({isDefault: false})
            .where(
                and(isNull(marketingProvider.userId), eq(marketingProvider.channel, data.channel))
            );
    }

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

export async function deleteSystemProvider(id: string) {
    await requireAdmin();
    await db
        .delete(marketingProvider)
        .where(and(eq(marketingProvider.id, id), isNull(marketingProvider.userId)));
    revalidatePath("/admin/settings");
}

export async function setDefaultProvider(id: string, channel: string) {
    await requireAdmin();
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

// ── Pricing ────────────────────────────────────────────────────────────────

/** All pricing rules — defaults + all user overrides, ordered newest first */
export async function getAllPricingRules() {
    await requireAdmin();
    return db
        .select({
            id: pricingRule.id,
            userId: pricingRule.userId,
            userName: user.name,
            userEmail: user.email,
            module: pricingRule.module,
            action: pricingRule.action,
            unitPrice: pricingRule.unitPrice,
            currency: pricingRule.currency,
            effectiveFrom: pricingRule.effectiveFrom,
            note: pricingRule.note,
            createdAt: pricingRule.createdAt,
        })
        .from(pricingRule)
        .leftJoin(user, eq(user.id, pricingRule.userId))
        .orderBy(asc(pricingRule.module), asc(pricingRule.action), desc(pricingRule.effectiveFrom));
}

/** Pricing rules for a specific user (their overrides + defaults for comparison) */
export async function getUserPricingRules(userId: string) {
    await requireAdmin();
    return db
        .select()
        .from(pricingRule)
        .where(eq(pricingRule.userId, userId))
        .orderBy(asc(pricingRule.module), desc(pricingRule.effectiveFrom));
}

export async function createPricingRule(data: {
    userId?: string | null;   // null = default
    module: string;
    action?: string;
    unitPrice: string;        // decimal string e.g. "0.001000"
    currency?: string;
    effectiveFrom: Date;
    note?: string;
}) {
    const session = await requireAdmin();
    const id = randomUUID();
    await db.insert(pricingRule).values({
        id,
        userId: data.userId ?? null,
        module: data.module,
        action: data.action ?? "send",
        unitPrice: data.unitPrice,
        currency: data.currency ?? "USD",
        effectiveFrom: data.effectiveFrom,
        note: data.note ?? null,
        createdBy: session.user.id,
        createdAt: new Date(),
    });
    revalidatePath("/admin/pricing");
    return id;
}

export async function deletePricingRule(id: string) {
    await requireAdmin();
    await db.delete(pricingRule).where(eq(pricingRule.id, id));
    revalidatePath("/admin/pricing");
}

/** Current effective price for a user (what they pay right now) */
export async function getEffectivePrice(userId: string, module: string, action = "send") {
    await requireAdmin();
    const {resolveUnitPrice} = await import("@/lib/pricing");
    return resolveUnitPrice(userId, module, action);
}
