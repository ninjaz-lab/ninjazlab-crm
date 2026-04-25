import {db} from "@/lib/db";
import {USER_ROLES} from "@/lib/enums";
import {module} from "@/lib/db/schema";
import {Routes} from "@/lib/constants/routes";

export async function seedUserModules() {
    console.log("     🌱 Seeding users modules...");

    const modules = [
        {
            key: "audience",
            title: "Audience",
            href: Routes.USER_AUDIENCE,
            iconName: "UserGroupIcon",
            scope: USER_ROLES.USER,
            exact: false,
            description: "Manage your contacts, lists, and segments.",
        },
        {
            key: "email_campaign",
            title: "Email Campaigns",
            href: Routes.USER_EMAIL_CAMPAIGNS,
            iconName: "Mail02Icon",
            scope: USER_ROLES.USER,
            exact: false,
            description: "Create and send email campaigns.",
        },
        // {
        //     key: "sms_campaign",
        //     title: "SMS Campaigns",
        //     href: ROUTES.USER_SMS_CAMPAIGNS,
        //     iconName: "Message02Icon",
        //     scope: USER_ROLES.USER,
        //     exact: false,
        //     description: "Send bulk SMS messages to your audience.",
        // },
        // {
        //     key: "whatsapp_marketing",
        //     title: "WhatsApp",
        //     href: ROUTES.USER_WHATSAPP_CAMPAIGNS,
        //     iconName: "WhatsappIcon",
        //     scope: USER_ROLES.USER,
        //     exact: false,
        //     description: "Engage customers via WhatsApp messages.",
        // },
        {
            key: "billing",
            title: "Billing",
            href: Routes.USER_BILLING,
            iconName: "Wallet02Icon",
            scope: USER_ROLES.USER,
            exact: false,
            description: "Top up your balance and view transaction history.",
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

    console.log("     User modules table seeded successfully! ✅");
}