import {db} from "@/lib/db"; // Adjust path to your db instance
import {appModule} from "@/lib/db/schema";
import {USER_ROLES} from "@/lib/enums";

export async function seedAppModules() {
    console.log("🌱 Seeding comprehensive app modules...");

    const modules = [
        // ─────────────────────────────────────────────
        // USER SCOPE MODULES
        // ─────────────────────────────────────────────
        {
            key: "audience",
            title: "Audience",
            href: "/audience",
            iconName: "Users",
            scope: USER_ROLES.USER,
            exact: false,
            description: "Manage your contacts, lists, and segments.",
        },
        {
            key: "email_marketing",
            title: "Email Marketing",
            href: "/marketing/email",
            iconName: "Mail",
            scope: USER_ROLES.USER,
            exact: false,
            description: "Create and send email campaigns.",
        },
        {
            key: "sms_marketing",
            title: "SMS Marketing",
            href: "/marketing/sms",
            iconName: "MessageSquare",
            scope: USER_ROLES.USER,
            exact: false,
            description: "Send bulk SMS messages to your audience.",
        },
        {
            key: "whatsapp_marketing",
            title: "WhatsApp Marketing",
            href: "/marketing/whatsapp",
            iconName: "MessageCircle",
            scope: USER_ROLES.USER,
            exact: false,
            description: "Engage customers via WhatsApp messages.",
        },
        {
            key: "wallet_billing",
            title: "Wallet & Billing",
            href: "/dashboard/billing",
            iconName: "Wallet",
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
            iconName: "UsersRound",
            scope: USER_ROLES.ADMIN,
            exact: false,
            description: "Manage system users and their permissions.",
        },
        {
            key: "admin_pricing",
            title: "Pricing Rules",
            href: "/admin/pricing",
            iconName: "CircleDollarSign",
            scope: USER_ROLES.ADMIN,
            exact: false,
            description: "Set unit prices for email and SMS actions.",
        }
    ];

    for (const mod of modules) {
        await db.insert(appModule)
            .values({
                ...mod,
            })
            .onConflictDoUpdate({
                target: appModule.key,
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

    console.log("✅ Modules table synced and restored.");
}