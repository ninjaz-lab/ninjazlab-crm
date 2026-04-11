import {db} from "@/lib/db"; // Adjust this import based on your actual db file path
import {pricingRule} from "@/lib/db/schema";
import {TRANSACTION_MODULES} from "@/lib/enums";
import {randomUUID} from "crypto";
import {isNull} from "drizzle-orm";

export async function seedPricingRules() {
    console.log("🌱 Starting pricing rule seed...");

    const defaultRules = [
        {
            id: randomUUID(),
            userId: null,
            module: TRANSACTION_MODULES.EMAIL,
            action: "send",
            unitPrice: "0.100000",
            currency: "MYR",
            effectiveFrom: new Date(),
            note: "System default email pricing",
            createdAt: new Date(),
        },
        {
            id: randomUUID(),
            userId: null,
            module: TRANSACTION_MODULES.SMS,
            action: "send",
            unitPrice: "0.100000",
            currency: "MYR",
            effectiveFrom: new Date(),
            note: "System default SMS pricing",
            createdAt: new Date(),
        }
    ];

    await db.delete(pricingRule).where(isNull(pricingRule.userId));

    for (const rule of defaultRules) {
        await db.insert(pricingRule).values(rule);
    }

    console.log("✅ Pricing rules seeded successfully!");
}
