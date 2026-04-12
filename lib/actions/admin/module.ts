"use server";

import {db} from "@/lib/db";
import {module, user, userPermission} from "@/lib/db/schema";
import {and, eq} from "drizzle-orm";
import {USER_ROLES} from "@/lib/enums";
import {randomUUID} from "crypto";
import {revalidatePath} from "next/cache";
import {authenticateAdmin} from "@/lib/actions/session";

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

export async function setModulePermission(
    userId: string,
    moduleId: string,
    enabled: boolean
) {
    // Validate is Admin
    await authenticateAdmin();

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