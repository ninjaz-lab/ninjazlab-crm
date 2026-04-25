import {seedUserModules} from "@/scripts/seed/data/user-modules";
import {seedPricingRules} from "@/scripts/seed/data/pricing-rule";
import {seedAdminModules} from "@/scripts/seed/data/admin-modules";

async function main() {
    try {
        console.log("🚀 Starting database seeding...");

        await seedAdminModules();
        await seedUserModules();
        await seedPricingRules();

        console.log("✅ Seeding completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

void main();
