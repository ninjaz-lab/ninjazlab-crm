import {USER_ROLES} from "@/lib/enums";
import {db} from "@/lib/db";
import {module} from "@/lib/db/schema";
import {Routes} from "@/lib/constants/routes";

export async function seedAdminModules() {
    console.log("     🌱 Seeding admin modules...");

    const modules = [
        {
            key: "admin_users",
            title: "Users",
            href: Routes.ADMIN_USER,
            iconName: "UserGroupIcon",
            scope: USER_ROLES.ADMIN,
            exact: false,
            description: "Manage system users and their permissions",
        },
        {
            key: "admin_pricing",
            title: "Pricing",
            href: Routes.ADMIN_PRICING,
            iconName: "MoneyBag02Icon",
            scope: USER_ROLES.ADMIN,
            exact: false,
            description: "Set unit prices for campaigns modules",
        },
        {
            key: "admin_billing",
            title: "Billing",
            href: Routes.ADMIN_BILLING,
            iconName: "Invoice01Icon",
            scope: USER_ROLES.ADMIN,
            exact: false,
            description: "Manage system billing, invoices, and tenant subscriptions",
        },
        {
            key: "admin_providers",
            title: "Service Providers",
            href: Routes.ADMIN_PROVIDERS,
            iconName: "ApiIcon",
            scope: USER_ROLES.ADMIN,
            exact: false,
            description: "Manage system-wide API configurations and tenant overrides",
        },
        {
            key: "admin_job_queue",
            title: "Job Queue",
            href: Routes.ADMIN_JOB_QUEUE,
            iconName: "Queue02Icon",
            scope: USER_ROLES.ADMIN,
            exact: false,
            description: "Monitor active campaigns blasts, background tasks, and failures",
        },
    ];


    for (const mod of modules) {
        await db.insert(module)
            .values({
                ...mod,
            })
            .onConflictDoUpdate({
                target: module.key,
                set: {
                    title: mod.title,
                    href: mod.href,
                    iconName: mod.iconName,
                    scope: mod.scope,
                    exact: mod.exact,
                    description: mod.description,
                    updatedAt: new Date(),
                },
            });
    }

    console.log("     Admin modules table seeded successfully! ✅");
}