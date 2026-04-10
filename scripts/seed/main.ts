import {seedAppModules} from "@/scripts/seed/data/app-modules";

async function main() {
    try {
        console.log("🚀 Starting database seeding...");

        await seedAppModules();

        console.log("✅ Seeding completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

main();