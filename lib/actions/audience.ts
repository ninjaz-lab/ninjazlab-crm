"use server";

import {randomUUID} from "crypto";
import {and, asc, count, desc, eq, ilike, inArray, or, sql} from "drizzle-orm";
import {db} from "@/lib/db";
import {audience, audience_segment, audienceSegmentMember} from "@/lib/db/schema";
import {SegmentRule} from "@/lib/audience-utils";
import {revalidatePath} from "next/cache";
import {buildDynamicSegmentQuery} from "@/lib/segments";
import {fetchSession} from "@/lib/session";
import {CHANNEL_STATUS} from "@/lib/enums";

// ─── Audience CRUD ─────────────────────────────────────────────────────────────

export type AudienceRow = typeof audience.$inferSelect;

export async function fetchAudiences(opts?: {
    search?: string;
    listId?: string;
    page?: number;
    pageSize?: number;
}) {
    const session = await fetchSession();
    const {search = "", listId, page = 1, pageSize = 50} = opts ?? {};
    const offset = (page - 1) * pageSize;

    // Base conditions: must belong to user, and apply search text if any
    let baseWhere = and(
        eq(audience.userId, session.user.id),
        search
            ? or(
                ilike(audience.firstName, `%${search}%`),
                ilike(audience.lastName, `%${search}%`),
                ilike(audience.email, `%${search}%`),
                ilike(audience.phone, `%${search}%`),
            )
            : undefined
    );

    if (listId) {
        // 1. Fetch the segment to see what type it is
        const [segment] = await db
            .select()
            .from(audience_segment)
            .where(and(eq(audience_segment.id, listId), eq(audience_segment.userId, session.user.id)));

        if (!segment) return {audiences: [], total: 0};

        if (segment.type === "dynamic") {
            // 2. DYNAMIC SEGMENT: Generate the WHERE clause from the JSON rules!
            const dynamicConditions = buildDynamicSegmentQuery(segment.rules as SegmentRule[]);

            // Combine our base search/user rules with the dynamic segment rules
            if (dynamicConditions) {
                baseWhere = and(baseWhere, dynamicConditions) as any;
            }

            const rows = await db
                .select()
                .from(audience)
                .where(baseWhere)
                .orderBy(desc(audience.createdAt))
                .limit(pageSize)
                .offset(offset);

            const [{total}] = await db
                .select({total: count()})
                .from(audience)
                .where(baseWhere);

            return {audiences: rows, total};

        } else {
            // 3. STATIC SEGMENT: Fall back to checking the audienceListMember join table
            const rows = await db
                .select({audience: audience})
                .from(audience)
                .innerJoin(audienceSegmentMember, eq(audienceSegmentMember.audienceId, audience.id))
                .where(and(baseWhere, eq(audienceSegmentMember.listId, listId)))
                .orderBy(desc(audience.createdAt))
                .limit(pageSize)
                .offset(offset);

            const [{total}] = await db
                .select({total: count()})
                .from(audience)
                .innerJoin(audienceSegmentMember, eq(audienceSegmentMember.audienceId, audience.id))
                .where(and(baseWhere, eq(audienceSegmentMember.listId, listId)));

            return {audiences: rows.map((r) => r.audience), total};
        }
    }

    // 4. NO SEGMENT SELECTED: Return all audiences
    const rows = await db
        .select()
        .from(audience)
        .where(baseWhere)
        .orderBy(desc(audience.createdAt))
        .limit(pageSize)
        .offset(offset);

    const [{total}] = await db
        .select({total: count()})
        .from(audience)
        .where(baseWhere);

    return {audiences: rows, total};
}

export async function createAudience(data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    notes?: string;
}) {
    const session = await fetchSession();
    const id = randomUUID();
    await db.insert(audience).values({
        id,
        userId: session.user.id,
        source: "manual",
        ...data,
        updatedAt: new Date(),
    });
    revalidatePath("/audiences");
    return id;
}

export async function updateAudience(
    audienceId: string,
    data: Partial<Omit<AudienceRow, "id" | "userId" | "createdAt" | "updatedAt" | "source">>
) {
    const session = await fetchSession();
    await db
        .update(audience)
        .set({...data, updatedAt: new Date()})
        .where(and(eq(audience.id, audienceId), eq(audience.userId, session.user.id)));
    revalidatePath("/audiences");
}

export async function deleteAudience(audienceId: string) {
    const session = await fetchSession();
    await db
        .delete(audience)
        .where(and(eq(audience.id, audienceId), eq(audience.userId, session.user.id)));
    revalidatePath("/audiences");
}

export async function deleteAudiences(audienceIds: string[]) {
    const session = await fetchSession();
    await db
        .delete(audience)
        .where(and(eq(audience.userId, session.user.id), inArray(audience.id, audienceIds)));
    revalidatePath("/audiences");
}

// ─── Audience Lists ─────────────────────────────────────────────────────────────

export type AudienceListRow = typeof audience_segment.$inferSelect;

export async function fetchAudienceLists() {
    const session = await fetchSession();

    // 1. Fetch all lists from the database
    const lists = await db
        .select()
        .from(audience_segment)
        .where(eq(audience_segment.userId, session.user.id))
        .orderBy(asc(audience_segment.name));

    // 2. Loop through the lists and calculate the live count for dynamic segments
    return await Promise.all(lists.map(async (list) => {
        if (list.type === "dynamic" && list.rules) {
            const rules = list.rules as SegmentRule[];
            const dynamicConditions = buildDynamicSegmentQuery(rules);

            // Base condition to ensure we only count this user's audience
            let baseWhere = eq(audience.userId, session.user.id);

            // Add the dynamic rules if they exist
            if (dynamicConditions)
                baseWhere = and(baseWhere, dynamicConditions) as any;

            // Run a quick count query against the database
            const [{total}] = await db
                .select({total: count()})
                .from(audience)
                .where(baseWhere);

            // Return the list with the calculated live count
            return {...list, count: total};
        }

        // If it's a static list, just return it as is
        return list;
    }));
}

export async function deleteAudienceList(listId: string) {
    const session = await fetchSession();
    await db
        .delete(audience_segment)
        .where(and(eq(audience_segment.id, listId), eq(audience_segment.userId, session.user.id)));
    revalidatePath("/audiences");
}

export async function addAudiencesToList(listId: string, audienceIds: string[]) {
    const session = await fetchSession();
    // Verify list belongs to user
    const [list] = await db
        .select()
        .from(audience_segment)
        .where(and(eq(audience_segment.id, listId), eq(audience_segment.userId, session.user.id)));
    if (!list) throw new Error("List not found");

    // Insert members, skip duplicates
    const existing = await db
        .select({audienceId: audienceSegmentMember.audienceId})
        .from(audienceSegmentMember)
        .where(
            and(
                eq(audienceSegmentMember.listId, listId),
                inArray(audienceSegmentMember.audienceId, audienceIds)
            )
        );
    const existingIds = new Set(existing.map((e) => e.audienceId));
    const newIds = audienceIds.filter((id) => !existingIds.has(id));

    if (newIds.length > 0) {
        await db.insert(audienceSegmentMember).values(
            newIds.map((audienceId) => ({id: randomUUID(), listId, audienceId}))
        );
        await db
            .update(audience_segment)
            .set({
                count: sql`${audience_segment.count}
                +
                ${newIds.length}`, updatedAt: new Date()
            })
            .where(eq(audience_segment.id, listId));
    }
    revalidatePath("/audiences");
}

export async function removeAudienceFromList(listId: string, audienceId: string) {
    const session = await fetchSession();
    const [list] = await db
        .select()
        .from(audience_segment)
        .where(and(eq(audience_segment.id, listId), eq(audience_segment.userId, session.user.id)));
    if (!list) throw new Error("List not found");

    await db
        .delete(audienceSegmentMember)
        .where(
            and(eq(audienceSegmentMember.listId, listId), eq(audienceSegmentMember.audienceId, audienceId))
        );
    await db
        .update(audience_segment)
        .set({
            count: sql`GREATEST
            ( ${audience_segment.count} -
                1,
                0)`, updatedAt: new Date()
        })
        .where(eq(audience_segment.id, listId));
    revalidatePath("/audiences");
}

export async function fetchUnsubscribedCounts() {
    const session = await fetchSession();
    const result = await db
        .select({
            emailUnsubscribe: sql<number>`cast
                (count(case when ${audience.emailStatus} = ${CHANNEL_STATUS.UNSUBSCRIBED} then 1 end) as int)`,
            phoneUnsubscribe: sql<number>`cast
                (count(case when ${audience.phoneStatus} = ${CHANNEL_STATUS.UNSUBSCRIBED} then 1 end) as int)`
        })
        .from(audience)
        .where(eq(audience.userId, session.user.id));

    return result[0] || {
        emailUnsubscribe: 0,
        phoneUnsubscribe: 0
    };
}
