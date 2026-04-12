"use server";

import {db} from "@/lib/db";
import {
    audience,
    marketingCampaign,
    marketingProvider,
    module,
    pricingRule,
    session,
    user,
    userPermission,
    wallets,
    walletTransaction
} from "@/lib/db/schema";
import {and, asc, desc, eq, ilike, inArray, isNull, or, sql} from "drizzle-orm";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {revalidatePath} from "next/cache";
import {randomUUID} from "crypto";
import {
    CAMPAIGN_STATUS,
    TRANSACTION_MODULES,
    TRANSACTION_TYPES,
    USER_ROLES,
    type UserRole,
    WALLET_TYPES
} from "@/lib/enums";

async function requireAdmin() {
    const session = await auth.api.getSession({headers: await headers()});
    if (!session || session.user.role !== USER_ROLES.ADMIN)
        throw new Error("Unauthorized");

    return session;
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function fetchAllUsers() {
    await requireAdmin();
    return db.select().from(user).orderBy(user.createdAt);
}

export async function fetchAllUsersWithWallets(
    page: number = 1,
    pageSize: number = 10,
    search?: string
) {
    await requireAdmin();

    const offset = (page - 1) * pageSize;
    const baseQuery = db.select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        banned: user.banned,
        createdAt: user.createdAt,
        balance: wallets.balance,
    })
        .from(user)
        .leftJoin(
            wallets,
            and(
                eq(user.id, wallets.userId),
                eq(wallets.walletType, WALLET_TYPES.MAIN)
            )
        );

    // Filter logic
    const whereClause = search
        ? or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`))
        : undefined;

    const data = await baseQuery
        .where(whereClause)
        .limit(pageSize)
        .offset(offset)
        .orderBy(asc(user.name));

    const [countResult] = await db
        .select({count: sql<number>`count(*)`})
        .from(user)
        .where(whereClause);

    return {
        users: data,
        total: Number(countResult.count),
    };

}

export async function setUserRole(userId: string, role: UserRole) {
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

// ── Accounts & Wallets ─────────────────────────────────────────────────────

export async function ensureMainWallet(userId: string) {
    const [existing] = await db
        .select()
        .from(wallets)
        .where(and(eq(wallets.userId, userId), eq(wallets.walletType, WALLET_TYPES.MAIN)))
        .limit(1);

    if (existing)
        return existing;

    // If not found, create and return the new wallet
    const [newWallet] = await db.insert(wallets).values({
        userId,
        walletType: WALLET_TYPES.MAIN,
        balance: "0",
    }).returning();

    return newWallet;
}

export async function adjustBalance(
    userId: string,
    amount: number,
    type: keyof typeof TRANSACTION_TYPES,
    note: string
) {
    const adminSession = await requireAdmin();

    // 1. Ensure the wallet exists and get the record
    const wallet = await ensureMainWallet(userId);

    const delta = type == 'CREDIT'
        ? amount
        : -amount;

    await db.transaction(async (tx) => {
        // 2. Update the wallet balance
        await tx.update(wallets)
            .set({
                balance: sql`${wallets.balance}
                +
                ${delta}`,
                updatedAt: new Date()
            })
            .where(eq(wallets.id, wallet.id));

        // 3. Record the transaction tied to that specific wallet
        await tx.insert(walletTransaction).values({
            id: randomUUID(),
            walletId: wallet.id,
            userId,
            amount: Math.abs(amount).toFixed(2),
            type: TRANSACTION_TYPES[type],
            module: TRANSACTION_MODULES.SYSTEM,
            note: note || `Admin adjustment`,
            createdAt: new Date(),
        });
    });

    revalidatePath("/admin/accounts");
}

export async function fetchUserFullDetails(userId: string) {
    await requireAdmin();

    // 1. Fetch User Identity
    const [userDetails] = await db
        .select()
        .from(user)
        .leftJoin(audience, eq(user.id, audience.userId))
        .leftJoin(wallets, and(eq(user.id, wallets.userId), eq(wallets.walletType, WALLET_TYPES.MAIN)))
        .where(eq(user.id, userId))
        .limit(1);

    // 2. Fetch Recent Transactions
    const transactions = await db
        .select()
        .from(walletTransaction)
        .where(eq(walletTransaction.userId, userId))
        .orderBy(desc(walletTransaction.createdAt))
        .limit(20);

    // 3. Fetch Ongoing/Scheduled Marketing Events
    const ongoingCampaigns = await db
        .select()
        .from(marketingCampaign)
        .where(
            and(
                eq(marketingCampaign.userId, userId),
                inArray(marketingCampaign.status, [
                    CAMPAIGN_STATUS.SCHEDULED,
                    CAMPAIGN_STATUS.SENDING,
                    CAMPAIGN_STATUS.PAUSED
                ])
            ))
        .orderBy(asc(marketingCampaign.scheduledAt));

    const userPricing = await db
        .select()
        .from(pricingRule)
        .where(eq(pricingRule.userId, userId));

    const defaultPricing = await db
        .select()
        .from(pricingRule)
        .where(isNull(pricingRule.userId));

    const [audienceCount] = await db
        .select({count: sql<number>`count(*)`})
        .from(audience)
        .where(eq(audience.userId, userId));

    const [latestSession] = await db
        .select()
        .from(session)
        .where(eq(session.userId, userId))
        .orderBy(desc(session.updatedAt))
        .limit(1);

    return {
        profile: userDetails,
        transactions,
        ongoingCampaigns,
        pricingRules: userPricing || [],
        defaultPricing: defaultPricing || [],
        stats: {
            totalAudience: Number(audienceCount?.count || 0),
            lastLoginAt: latestSession?.updatedAt || latestSession?.createdAt || null,
        }
    };
}

export async function fetchUserTransactions(
    userId: string,
    page: number = 1,
    pageSize: number = 10
) {
    await requireAdmin();
    const offset = (page - 1) * pageSize;

    const [transactions, countResult] = await Promise.all([
        db.select().from(walletTransaction)
            .where(eq(walletTransaction.userId, userId))
            .limit(pageSize).offset(offset).orderBy(desc(walletTransaction.createdAt)),
        db.select({count: sql<number>`count(*)`}).from(walletTransaction)
            .where(eq(walletTransaction.userId, userId))
    ]);

    return {
        transactions,
        total: Number(countResult[0].count)
    };
}

// ── Permissions ────────────────────────────────────────────────────────────

export async function fetchAllModules() {
    await requireAdmin();
    return db.select().from(module).orderBy(module.title);
}

export async function fetchAllUsersWithPermissions() {
    await requireAdmin();
    const users = await db.select().from(user).where(eq(user.role, USER_ROLES.USER));

    // Fetch all dynamic modules and permissions
    const allModules = await db.select().from(module);
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
            userImage: user.image,
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
    userId?: string | null;
    module: string;
    action?: string;
    unitPrice: string;
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

export async function updatePricingRule(id: string, data: {
    unitPrice: string;
    effectiveFrom: Date;
    note?: string;
}) {
    await requireAdmin();
    await db.update(pricingRule).set({
        unitPrice: data.unitPrice,
        effectiveFrom: data.effectiveFrom,
        note: data.note ?? null,
    }).where(eq(pricingRule.id, id));

    revalidatePath("/admin/pricing");
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
