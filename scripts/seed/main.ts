import {seedAppModules} from "@/scripts/seed/data/app-modules";
import {seedPricingRules} from "@/scripts/seed/data/pricing-rule";

async function main() {
    try {
        console.log("🚀 Starting database seeding...");

        await seedAppModules();
        await seedPricingRules();

        console.log("✅ Seeding completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

void main();
