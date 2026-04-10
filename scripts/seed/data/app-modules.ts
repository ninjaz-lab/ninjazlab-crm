import {db} from "../../../lib/db"; // Adjust path to your db instance
import {appModule} from "../../../lib/db/schema";

export async function seedAppModules() {
    console.log("🌱 Seeding app modules...");

    const modules = [
        {
            key: "email_marketing",
            title: "Email Marketing",
            href: "/dashboard/email",
            iconName: "Mail",
            scope: "user",
        },
        {
            key: "sms_marketing",
            title: "SMS Marketing",
            href: "/dashboard/sms",
            iconName: "MessageSquare",
            scope: "user",
        },
        {
            key: "whatsapp_marketing",
            title: "WhatsApp Marketing",
            href: "/dashboard/whatsapp",
            iconName: "MessageCircle",
            scope: "user",
        },
        {
            key: "admin_settings",
            title: "System Settings",
            href: "/admin/settings",
            iconName: "Settings",
            scope: "admin",
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
                    scope: mod.scope
                },
            });
    }

    console.log("✅ Modules table synced.");
}
