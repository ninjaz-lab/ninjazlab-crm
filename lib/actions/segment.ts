"use server";

import {and, count, eq, isNotNull, sql} from "drizzle-orm";
import {db} from "@/lib/db";
import {audience, audienceList} from "@/lib/db/schema";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {type SegmentRule} from "@/lib/audience-utils";
import {buildDynamicSegmentQuery} from "@/lib/segments";
import {randomUUID} from "crypto";
import {revalidatePath} from "next/cache";

async function getSession() {
    const session = await auth.api.getSession({headers: await headers()});
    if (!session) throw new Error("Unauthorized");
    return session;
}

export async function getAvailableFields() {
    const session = await getSession();

    const standardFields = [
        {id: "firstName", label: "First Name", type: "standard" as const, inputType: "text" as const},
        {id: "lastName", label: "Last Name", type: "standard" as const, inputType: "text" as const},
        {id: "email", label: "Email Address", type: "standard" as const, inputType: "text" as const},
        {id: "phone", label: "Phone Number", type: "standard" as const, inputType: "text" as const},
        {id: "state", label: "State / Province", type: "standard" as const, inputType: "select" as const},
        {id: "city", label: "City", type: "standard" as const, inputType: "select" as const},
        {id: "country", label: "Country", type: "standard" as const, inputType: "select" as const},
        {id: "source", label: "Import Source", type: "standard" as const, inputType: "select" as const}
    ];

    const result = await db.execute(sql`
        SELECT DISTINCT jsonb_object_keys(${audience.customFields}) as key
        FROM ${audience}
        WHERE ${audience.userId} = ${session.user.id}
    `);

    const customFields = result.rows.map((r) => ({
        id: String(r.key),
        label: String(r.key).charAt(0).toUpperCase() + String(r.key).slice(1),
        type: "custom" as const
    }));

    return [...standardFields, ...customFields];
}

export async function getDistinctFieldValues(fieldId: string, type: "standard" | "custom") {
    const session = await getSession();

    if (type === "standard") {
        const allowedCols = [
            "firstName", "lastName", "email", "phone",
            "state", "city", "country", "source"
        ] as const;
        if (!allowedCols.includes(fieldId as any))
            return [];

        const col = audience[fieldId as keyof typeof audience];

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

        return results.rows.map(r => String(r.value)).filter(v => v.trim() !== "");
    }
}

export async function previewSegmentCount(rules: SegmentRule[]) {
    const session = await getSession();

    const validRules = rules.filter(r => r.field && r.operator && r.value);

    if (validRules.length === 0) {
        const [{total}] = await db
            .select({total: count()})
            .from(audience)
            .where(eq(audience.userId, session.user.id));
        return total;
    }

    const dynamicConditions = buildDynamicSegmentQuery(validRules);

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

export async function createDynamicSegment(name: string, color: string, rules: SegmentRule[]) {
    const session = await getSession();
    const id = randomUUID();

    // Ensure we don't save incomplete rules
    const validRules = rules.filter(r => r.field && r.operator && r.value);
    if (validRules.length === 0)
        throw new Error("Cannot save a segment without valid rules");

    await db.insert(audienceList).values({
        id,
        userId: session.user.id,
        name,
        color,
        type: "dynamic",
        rules: validRules, // Store the JSON array directly in the DB
        count: 0, // Dynamic segments don't rely on a static count column
        updatedAt: new Date(),
    });

    revalidatePath("/audience");
    return id;
}

export async function previewSegmentContacts(rules: SegmentRule[], limit = 50) {
    const session = await getSession();

    const validRules = rules.filter(r => r.field && r.operator && r.value);

    let conditions = eq(audience.userId, session.user.id);

    // If we have valid rules, apply them. Otherwise, just return a generic sample.
    if (validRules.length > 0) {
        const dynamicConditions = buildDynamicSegmentQuery(validRules);
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