"use server";

import {db} from "@/lib/db";
import {
    audience,
    marketingCampaign,
    pricingRule,
    session,
    user,
    userPermission,
    wallets,
    walletTransaction
} from "@/lib/db/schema";
import {and, asc, desc, eq, ilike, inArray, isNull, or, sql} from "drizzle-orm";
import {CAMPAIGN_STATUS, type UserRole, WALLET_TYPES} from "@/lib/enums";
import {revalidatePath} from "next/cache";
import {authenticateAdmin} from "@/lib/actions/session";
import {Routes} from "@/lib/constants/routes";

export async function fetchAllUsers() {
    // Validate is Admin
    await authenticateAdmin();

    return db.select()
        .from(user)
        .orderBy(user.createdAt);
}

export async function fetchAllUsersWithWallets(
    page: number = 1,
    pageSize: number = 10,
    search?: string
) {
    // Validate is Admin
    await authenticateAdmin();

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

    const userIds = data.map(u => u.id);
    let allPerms: any[] = [];
    if (userIds.length > 0)
        allPerms = await db.select()
            .from(userPermission)
            .where(inArray(userPermission.userId, userIds));

    const usersWithPerms = data.map(u => {
        const perms: Record<string, boolean> = {};
        allPerms.filter(p => p.userId === u.id).forEach(p => {
            perms[p.moduleId] = p.enabled;
        });
        return {...u, permissions: perms};
    });

    const [countResult] = await db
        .select({
            count: sql<number>`count
                (*)`
        })
        .from(user)
        .where(whereClause);

    return {
        users: usersWithPerms,
        totalUsers: Number(countResult.count),
    };

}

export async function setUserRole(
    userId: string,
    role: UserRole
) {
    // Validate is Admin
    await authenticateAdmin();

    await db
        .update(user)
        .set({role, updatedAt: new Date()})
        .where(eq(user.id, userId));
    revalidatePath(Routes.ADMIN_USER);
}

export async function banUser(
    userId: string,
    reason: string
) {
    // Validate is Admin
    await authenticateAdmin();

    await db
        .update(user)
        .set({banned: true, banReason: reason, updatedAt: new Date()})
        .where(eq(user.id, userId));
    revalidatePath(Routes.ADMIN_USER);
}

export async function unbanUser(userId: string) {
    // Validate is Admin
    await authenticateAdmin();

    await db
        .update(user)
        .set({banned: false, banReason: null, updatedAt: new Date()})
        .where(eq(user.id, userId));
    revalidatePath(Routes.ADMIN_USER);
}

export async function fetchUserFullDetails(userId: string) {
    // Validate is Admin
    await authenticateAdmin();

    // 1. Fetch User Identity
    const [userDetails] = await db
        .select()
        .from(user)
        .leftJoin(audience, eq(user.id, audience.userId))
        .leftJoin(wallets, and(eq(user.id, wallets.userId), eq(wallets.walletType, WALLET_TYPES.MAIN)))
        .where(eq(user.id, userId))
        .limit(1);

    const userPerms = await db.select().from(userPermission).where(eq(userPermission.userId, userId));
    const permMap: Record<string, boolean> = {};
    userPerms.forEach(p => {
        permMap[p.moduleId] = p.enabled;
    });

    if (userDetails && userDetails.user)
        (userDetails.user as any).permissions = permMap;

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
        .select({
            count: sql<number>`count
                (*)`
        })
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
