import {seedModules} from "@/scripts/seed/data/modules";
import {seedPricingRules} from "@/scripts/seed/data/pricing-rule";

async function main() {
    try {
        console.log("🚀 Starting database seeding...");

        await seedModules();
        await seedPricingRules();

        console.log("✅ Seeding completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

void main();
