"use server";

import {and, count, eq, isNotNull, sql} from "drizzle-orm";
import {db} from "@/lib/db";
import {audience, audience_segment} from "@/lib/db/schema";
import {type SegmentRule} from "@/lib/audience-utils";
import {buildDynamicSegmentQuery} from "@/lib/segments";
import {randomUUID} from "crypto";
import {revalidatePath} from "next/cache";
import {fetchSession} from "@/lib/session";

export async function getAvailableFields() {
    const session = await fetchSession();

    const standardFields = [
        {id: "firstName", label: "First Name", type: "standard" as const, inputType: "text" as const},
        {id: "lastName", label: "Last Name", type: "standard" as const, inputType: "text" as const},
        {id: "email", label: "Email Address", type: "standard" as const, inputType: "text" as const},
        {id: "phone", label: "Phone Number", type: "standard" as const, inputType: "text" as const},
        {id: "state", label: "State", type: "standard" as const, inputType: "select" as const},
        {id: "city", label: "City", type: "standard" as const, inputType: "select" as const},
        {id: "country", label: "Country", type: "standard" as const, inputType: "select" as const},
        {id: "source", label: "Import Source", type: "standard" as const, inputType: "select" as const}
    ];

    const result = await db.execute(sql`
        SELECT DISTINCT jsonb_object_keys(${audience.customFields}::jsonb) as key
        FROM ${audience}
        WHERE ${audience.userId} = ${session.user.id}
    `);

    const customFields = result.map((r) => ({
        id: String(r.key),
        label: String(r.key).charAt(0).toUpperCase() + String(r.key).slice(1),
        type: "custom" as const
    }));

    return [...standardFields, ...customFields];
}

export async function getDistinctFieldValues(
    fieldId: string,
    type: "standard" | "custom"
) {
    const session = await fetchSession();

    if (type === "standard") {
        let col;
        switch (fieldId) {
            case "firstName":
                col = audience.firstName;
                break;
            case "lastName":
                col = audience.lastName;
                break;
            case "email":
                col = audience.email;
                break;
            case "phone":
                col = audience.phone;
                break;
            case "state":
                col = audience.state;
                break;
            case "city":
                col = audience.city;
                break;
            case "country":
                col = audience.country;
                break;
            case "source":
                col = audience.source;
                break;
            default:
                return []; // Failsafe for invalid inputs
        }

        const results = await db
            .selectDistinct({value: col})
            .from(audience)
            .where(and(eq(audience.userId, session.user.id), isNotNull(col)));

        return results.map(r => String(r.value)).filter(v => v.trim() !== "");
    } else {
        const results = await db.execute(sql`
            SELECT DISTINCT ${audience.customFields} ->>${fieldId} as value
            FROM ${audience}
            WHERE ${audience.userId} = ${session.user.id}
              AND ${audience.customFields}->>${fieldId} IS NOT NULL
        `);

        return results.map(r => String(r.value)).filter(v => v.trim() !== "");
    }
}

export async function previewSegmentCount(input: any, matchType: "AND" | "OR" = "AND") {
    const session = await fetchSession();

    let rulesArray: SegmentRule[] = [];
    let resolvedMatchType = matchType;

    if (Array.isArray(input)) {
        rulesArray = input;
    } else if (input && typeof input === 'object' && Array.isArray(input.rules)) {
        rulesArray = input.rules;
        resolvedMatchType = input.matchType || matchType;
    }

    const validRules = rulesArray.filter(r => r.field && r.operator && r.value);

    if (validRules.length === 0) {
        const [{total}] = await db
            .select({total: count()})
            .from(audience)
            .where(eq(audience.userId, session.user.id));
        return total;
    }

    const dynamicConditions = buildDynamicSegmentQuery(validRules, resolvedMatchType);

    const [{total}] = await db
        .select({total: count()})
        .from(audience)
        .where(
            and(
                eq(audience.userId, session.user.id),
                dynamicConditions
            )
        );

    return total;
}

export async function createDynamicSegment(
    name: string,
    color: string,
    rules: SegmentRule[],
    matchType: "AND" | "OR" = "AND"
) {
    const session = await fetchSession();
    const id = randomUUID();

    // Ensure we don't save incomplete rules
    const validRules = rules.filter(r => r.field && r.operator && r.value);
    if (validRules.length === 0)
        throw new Error("Cannot save a segment without valid rules");

    const totalCount = await previewSegmentCount(validRules, matchType);

    await db.insert(audience_segment).values({
        id,
        userId: session.user.id,
        name,
        color,
        type: "dynamic",
        rules: {matchType, rules: validRules},
        count: totalCount,
        updatedAt: new Date(),
    });

    revalidatePath("/audience");
    return id;
}

export async function previewSegmentContacts(
    input: any,
    matchType: "AND" | "OR" = "AND",
    limit = 50
) {
    const session = await fetchSession();

    let rulesArray: SegmentRule[] = [];
    let resolvedMatchType = matchType;

    if (Array.isArray(input)) {
        rulesArray = input;
    } else if (input && typeof input === 'object' && Array.isArray(input.rules)) {
        rulesArray = input.rules;
        resolvedMatchType = input.matchType || matchType;
    }

    const validRules = rulesArray.filter(r => r.field && r.operator && r.value);

    let conditions = eq(audience.userId, session.user.id);

    // If we have valid rules, apply them. Otherwise, just return a generic sample.
    if (validRules.length > 0) {
        const dynamicConditions = buildDynamicSegmentQuery(validRules, resolvedMatchType);
        if (dynamicConditions)
            conditions = and(conditions, dynamicConditions) as any;
    }

    return await db
        .select({
            id: audience.id,
            firstName: audience.firstName,
            lastName: audience.lastName,
            email: audience.email,
            phone: audience.phone,
            state: audience.state,
        })
        .from(audience)
        .where(conditions)
        .limit(limit);
}

export async function updateDynamicSegment(
    id: string,
    name: string,
    color: string,
    rules: SegmentRule[],
    matchType: "AND" | "OR" = "AND"
) {
    const session = await fetchSession();

    // Ensure we don't save incomplete rules
    const validRules = rules.filter(r => r.field && r.operator && r.value);
    if (validRules.length === 0)
        throw new Error("Cannot save a segment without valid rules");

    const totalCount = await previewSegmentCount(validRules, matchType);

    await db.update(audience_segment).set({
        name,
        color,
        rules: {matchType, rules: validRules},
        count: totalCount,
        updatedAt: new Date(),
    }).where(
        and(
            eq(audience_segment.id, id),
            eq(audience_segment.userId, session.user.id) // Security: Only owner can edit
        )
    );

    revalidatePath("/audience");
}