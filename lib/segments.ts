import {and, eq, ilike, ne, or, SQL, sql} from "drizzle-orm";
import {audience} from "@/lib/db/schema";
import {SegmentRule} from "@/lib/audience-utils";

export function buildDynamicSegmentQuery(
    input: any,
    providedMatchType?: "AND" | "OR"
): SQL | undefined {
    if (!input)
        return undefined;

    let rules: SegmentRule[] = [];
    let matchType: "AND" | "OR" = providedMatchType || "AND";

    if (Array.isArray(input)) {
        rules = input;
    } else if (input && typeof input === 'object' && Array.isArray(input.rules)) {
        // New format: input is { matchType, rules: [...] }
        rules = input.rules;
        matchType = input.matchType || matchType;
    }

    if (rules.length === 0)
        return undefined;

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

    return matchType === "OR" ? or(...conditions) : and(...conditions);
}