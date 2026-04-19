"use server";

import {headers} from "next/headers";
import {auth} from "@/lib/auth";
import {db} from "@/lib/db";
import {module, userPermission} from "@/lib/db/schema";
import {and, eq} from "drizzle-orm";
import {USER_ROLES} from "@/lib/enums";
import {authenticateUser} from "@/lib/actions/session";

export async function fetchGrantedModules() {
    const session = await authenticateUser();

    const defaultDashboard = {
        id: "default-dashboard",
        title: "Dashboard",
        href: "/",
        iconName: "LayoutDashboard",
        exact: true
    };

    let grantedModules;

    if (session.user.role === USER_ROLES.ADMIN) {
        // Admins see all modules that have the "user" scope
        grantedModules = await db.select({
            id: module.id,
            title: module.title,
            href: module.href,
            iconName: module.iconName,
            exact: module.exact,
        })
            .from(module)
            .where(eq(module.scope, USER_ROLES.USER));
    } else {
        // Regular users only see module joined through userPermission
        grantedModules = await db.select({
            id: module.id,
            title: module.title,
            href: module.href,
            iconName: module.iconName,
            exact: module.exact,
        })
            .from(module)
            .innerJoin(userPermission, eq(module.id, userPermission.moduleId))
            .where(
                and(
                    eq(userPermission.userId, session.user.id),
                    eq(userPermission.enabled, true),
                    eq(module.scope, USER_ROLES.USER)
                )
            );
    }

    return [defaultDashboard, ...grantedModules];
}

export async function fetchAdminModules() {
    const session = await auth.api.getSession({headers: await headers()});
    if (!session || session.user.role !== USER_ROLES.ADMIN)
        throw new Error("Unauthorized");

    const defaultDashboard = {
        id: "default-dashboard",
        title: "Dashboard",
        href: "/admin",
        iconName: "LayoutDashboard",
        exact: true
    };

    const modules = await db.select({
            id: module.id,
            title: module.title,
            href: module.href,
            iconName: module.iconName,
            exact: module.exact,
        }
    ).from(module)
        .where(eq(module.scope, USER_ROLES.ADMIN))
        .orderBy(module.title);

    return [defaultDashboard, ...modules];
}
