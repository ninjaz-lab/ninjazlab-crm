"use server";

import {db} from "@/lib/db";
import {module, user, userPermission} from "@/lib/db/schema";
import {eq} from "drizzle-orm";
import {USER_ROLES} from "@/lib/enums";
import {randomUUID} from "crypto";
import {revalidatePath} from "next/cache";
import {authenticateAdmin} from "@/lib/actions/session";
import {Routes} from "@/lib/constants/routes";

export async function fetchAllModules() {
    // Validate is Admin
    await authenticateAdmin();

    return db.select().from(module).orderBy(module.title);
}

export async function fetchAllUsersWithPermissions() {
    // Validate is Admin
    await authenticateAdmin();

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

export async function setBulkModulePermissions(
    userId: string,
    moduleIds: string[],
    enabled: boolean
) {
    // Validate is Admin
    await authenticateAdmin();

    if (moduleIds.length === 0) return;

    await db.insert(userPermission)
        .values(
            moduleIds.map((mId) => ({
                id: randomUUID(),
                userId,
                moduleId: mId,
                enabled,
                updatedAt: new Date(),
            }))
        )
        .onConflictDoUpdate({
            target: [userPermission.userId, userPermission.moduleId],
            set: {
                enabled,
                updatedAt: new Date()
            },
        });

    revalidatePath(Routes.ADMIN_MODULES);
}