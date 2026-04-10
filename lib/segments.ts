import {and, eq, ilike, ne, SQL, sql} from "drizzle-orm";
import {audience} from "@/lib/db/schema";
import {type SegmentRule} from "@/lib/audience-utils";

export function buildDynamicSegmentQuery(rules: SegmentRule[]): SQL | undefined {
    if (!rules || rules.length === 0) return undefined;

    const conditions = rules.map((rule) => {
        let dbField: any;

        if (rule.type === "standard")
            dbField = audience[rule.field as keyof typeof audience];
        else
            dbField = sql`${audience.customFields}
            ->>
            ${rule.field}`;

        switch (rule.operator) {
            case "equals":
                return eq(dbField, rule.value);
            case "not_equals":
                return ne(dbField, rule.value);
            case "contains":
                return ilike(dbField, `%${rule.value}%`);
            default:
                return eq(dbField, rule.value);
        }
    });

    return and(...conditions);
}