"use server";

import {headers} from "next/headers";
import {auth} from "@/lib/auth";
import {db} from "@/lib/db";
import {appModule, userPermission} from "@/lib/db/schema";
import {and, eq} from "drizzle-orm";
import {USER_ROLES} from "@/lib/enums";

export async function fetchGrantedModules() {
    const session = await auth.api.getSession({headers: await headers()});
    if (!session)
        throw new Error("Unauthorized");

    const defaultDashboard = {
        id: "default-dashboard",
        title: "Dashboard",
        href: "/dashboard",
        iconName: "LayoutDashboard",
        exact: true
    };

    let grantedModules;

    if (session.user.role === USER_ROLES.ADMIN) {
        // Admins see all modules that have the "user" scope
        grantedModules = await db.select({
            id: appModule.id,
            title: appModule.title,
            href: appModule.href,
            iconName: appModule.iconName,
            exact: appModule.exact,
        })
            .from(appModule)
            .where(eq(appModule.scope, USER_ROLES.USER));
    } else {
        // Regular users only see modules joined through userPermission
        grantedModules = await db.select({
            id: appModule.id,
            title: appModule.title,
            href: appModule.href,
            iconName: appModule.iconName,
            exact: appModule.exact,
        })
            .from(appModule)
            .innerJoin(userPermission, eq(appModule.id, userPermission.moduleId))
            .where(
                and(
                    eq(userPermission.userId, session.user.id),
                    eq(userPermission.enabled, true),
                    eq(appModule.scope, USER_ROLES.USER)
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
            id: appModule.id,
            title: appModule.title,
            href: appModule.href,
            iconName: appModule.iconName,
            exact: appModule.exact,
        }
    ).from(appModule)
        .where(eq(appModule.scope, USER_ROLES.ADMIN))
        .orderBy(appModule.title);

    return [defaultDashboard, ...modules];
}
