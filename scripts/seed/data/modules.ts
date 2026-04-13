import {db} from "@/lib/db";
import {USER_ROLES} from "@/lib/enums";
import {module} from "@/lib/db/schema";

export async function seedModules() {
    console.log("     🌱 Seeding comprehensive app modules...");

    const modules = [
        // ─────────────────────────────────────────────
        // USER SCOPE MODULES
        // ─────────────────────────────────────────────
        {
            key: "audience",
            title: "Audience",
            href: "/audience",
            iconName: "UserGroupIcon",
            scope: USER_ROLES.USER,
            exact: false,
            description: "Manage your contacts, lists, and segments.",
        },
        {
            key: "email_marketing",
            title: "Email Marketing",
            href: "/marketing/email",
            iconName: "Mail02Icon",
            scope: USER_ROLES.USER,
            exact: false,
            description: "Create and send email campaigns.",
        },
        {
            key: "sms_marketing",
            title: "SMS Marketing",
            href: "/marketing/sms",
            iconName: "Message02Icon",
            scope: USER_ROLES.USER,
            exact: false,
            description: "Send bulk SMS messages to your audience.",
        },
        {
            key: "whatsapp_marketing",
            title: "WhatsApp Marketing",
            href: "/marketing/whatsapp",
            iconName: "WhatsappIcon",
            scope: USER_ROLES.USER,
            exact: false,
            description: "Engage customers via WhatsApp messages.",
        },
        {
            key: "wallet_billing",
            title: "Wallet & Billing",
            href: "/dashboard/billing",
            iconName: "Wallet02Icon",
            scope: USER_ROLES.USER,
            exact: false,
            description: "Top up your balance and view transaction history.",
        },

        // ─────────────────────────────────────────────
        // ADMIN SCOPE MODULES
        // ─────────────────────────────────────────────
        {
            key: "admin_users",
            title: "User Management",
            href: "/admin/users",
            iconName: "AiUserIcon",
            scope: USER_ROLES.ADMIN,
            exact: false,
            description: "Manage system users and their permissions.",
        },
        {
            key: "admin_pricing",
            title: "Pricing Rules",
            href: "/admin/pricing",
            iconName: "MoneyBag02Icon",
            scope: USER_ROLES.ADMIN,
            exact: false,
            description: "Set unit prices for email and SMS actions.",
        },
        {
            key: "admin_access_control",
            title: "Access Control",
            href: "/admin/modules",
            iconName: "TwoFactorAccessIcon",
            scope: USER_ROLES.ADMIN,
            exact: false,
            description: "Grant or revoke module access for specific users.",
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

    console.log("     Modules table seeded successfully! ✅");
}