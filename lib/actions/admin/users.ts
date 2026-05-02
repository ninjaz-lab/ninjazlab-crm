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
import {
    AdminActionError,
    ADMIN_ERROR_CODES,
    validateExists,
    executeAdminAction
} from "@/lib/actions/admin/error-handler";

/**
 * Fetch all users from the database
 * @throws AdminActionError if user is not authenticated or database query fails
 */
export async function fetchAllUsers() {
    return executeAdminAction(async () => {
        await authenticateAdmin();

        return db.select()
            .from(user)
            .orderBy(user.createdAt);
    }, "Failed to fetch users");
}

/**
 * Fetch paginated users with wallet information
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of results per page
 * @param search - Optional search term for name or email
 * @throws AdminActionError if authentication fails or database query fails
 */
export async function fetchAllUsersWithWallets(
    page: number = 1,
    pageSize: number = 10,
    search?: string
) {
    return executeAdminAction(async () => {
        await authenticateAdmin();

        // Validate pagination parameters
        if (page < 1 || pageSize < 1) {
            throw new AdminActionError(
                "Page and pageSize must be greater than 0",
                ADMIN_ERROR_CODES.INVALID_INPUT
            );
        }

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
                count: sql<number>`count(*)`
            })
            .from(user)
            .where(whereClause);

        return {
            users: usersWithPerms,
            totalUsers: Number(countResult.count),
        };
    }, "Failed to fetch users with wallets");
}

/**
 * Set user role
 * @param userId - User ID to update
 * @param role - New role for the user
 * @throws AdminActionError if user not found or validation fails
 */
export async function setUserRole(
    userId: string,
    role: UserRole
) {
    return executeAdminAction(async () => {
        const session = await authenticateAdmin();

        // Validate input
        if (!userId || !role) {
            throw new AdminActionError(
                "User ID and role are required",
                ADMIN_ERROR_CODES.INVALID_INPUT
            );
        }

        // Check user exists
        const [existingUser] = await db.select()
            .from(user)
            .where(eq(user.id, userId))
            .limit(1);
        validateExists(existingUser, "User", userId);

        // Prevent self-demotion
        if (session?.user.id === userId && role !== existingUser.role) {
            throw new AdminActionError(
                "You cannot change your own role",
                ADMIN_ERROR_CODES.CANNOT_DEMOTE_SELF
            );
        }

        await db
            .update(user)
            .set({role, updatedAt: new Date()})
            .where(eq(user.id, userId));

        revalidatePath(Routes.ADMIN_USER);
    }, "Failed to set user role");
}

/**
 * Ban a user
 * @param userId - User ID to ban
 * @param reason - Reason for ban
 * @throws AdminActionError if user not found or validation fails
 */
export async function banUser(
    userId: string,
    reason: string
) {
    return executeAdminAction(async () => {
        await authenticateAdmin();

        // Validate input
        if (!userId || !reason) {
            throw new AdminActionError(
                "User ID and ban reason are required",
                ADMIN_ERROR_CODES.INVALID_INPUT
            );
        }

        // Check user exists
        const [existingUser] = await db.select()
            .from(user)
            .where(eq(user.id, userId))
            .limit(1);
        validateExists(existingUser, "User", userId);

        await db
            .update(user)
            .set({banned: true, banReason: reason, updatedAt: new Date()})
            .where(eq(user.id, userId));

        revalidatePath(Routes.ADMIN_USER);
    }, "Failed to ban user");
}

/**
 * Unban a user
 * @param userId - User ID to unban
 * @throws AdminActionError if user not found
 */
export async function unbanUser(userId: string) {
    return executeAdminAction(async () => {
        await authenticateAdmin();

        // Validate input
        if (!userId) {
            throw new AdminActionError(
                "User ID is required",
                ADMIN_ERROR_CODES.INVALID_INPUT
            );
        }

        // Check user exists
        const [existingUser] = await db.select()
            .from(user)
            .where(eq(user.id, userId))
            .limit(1);
        validateExists(existingUser, "User", userId);

        await db
            .update(user)
            .set({banned: false, banReason: null, updatedAt: new Date()})
            .where(eq(user.id, userId));

        revalidatePath(Routes.ADMIN_USER);
    }, "Failed to unban user");
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
