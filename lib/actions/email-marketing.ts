"use server";

import {revalidatePath} from "next/cache";
import {and, desc, eq, ilike, ne, SQL} from "drizzle-orm";
import {randomUUID} from "crypto";
import {db} from "@/lib/db";
import {
    audience,
    audience_segment,
    audienceSegmentMember,
    emailCampaign,
    jobMarketingBlast,
    marketingCampaign,
} from "@/lib/db/schema";
import {CAMPAIGN_SEND_MODE, CAMPAIGN_STATUS} from "@/lib/enums";
import {fetchEmailBlastQueue, type RecipientRow} from "@/lib/queue";
import {fetchSession} from "@/lib/session";
import {parseFromAppTimezone} from "@/lib/utils/timezone";

export async function fetchEmailCampaigns() {
    const session = await fetchSession();
    return db
        .select({
            id: marketingCampaign.id,
            name: marketingCampaign.name,
            status: marketingCampaign.status,
            scheduledAt: marketingCampaign.scheduledAt,
            totalRecipients: marketingCampaign.totalRecipients,
            sentCount: marketingCampaign.sentCount,
            openedCount: marketingCampaign.openedCount,
            clickedCount: marketingCampaign.clickedCount,
            createdAt: marketingCampaign.createdAt,
            fromName: emailCampaign.fromName,
            fromEmail: emailCampaign.fromEmail,
        })
        .from(marketingCampaign)
        .leftJoin(
            emailCampaign,
            eq(emailCampaign.campaignId, marketingCampaign.id)
        )
        .where(
            and(
                eq(marketingCampaign.userId, session.user.id),
                eq(marketingCampaign.channel, "email")
            )
        )
        .orderBy(desc(marketingCampaign.createdAt));
}

export async function fetchEmailCampaignById(id: string) {
    const session = await fetchSession();
    const [row] = await db
        .select()
        .from(marketingCampaign)
        .innerJoin(
            emailCampaign,
            eq(emailCampaign.campaignId, marketingCampaign.id)
        )
        .where(
            and(
                eq(marketingCampaign.id, id),
                eq(marketingCampaign.userId, session.user.id)
            )
        )
        .limit(1);
    return row ?? null;
}

export async function createEmailCampaign(data: {
    name: string;
    fromName: string;
    fromEmail: string;
    replyTo?: string;
    templateId: string;
    recipientRows: RecipientRow[];
    providerId?: string;
    scheduledAt?: Date;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
}) {
    const session = await fetchSession();
    const campaignId = randomUUID();

    const recipientRows = data.recipientRows.filter((r) => r.email.includes("@"));
    const totalRecipients = recipientRows.length;

    await db.insert(marketingCampaign).values({
        id: campaignId,
        userId: session.user.id,
        channel: "email",
        name: data.name,
        status: data.scheduledAt ? CAMPAIGN_STATUS.SCHEDULED : CAMPAIGN_STATUS.DRAFT,
        templateId: data.templateId,
        listId: null,
        providerId: data.providerId ?? null,
        scheduledAt: data.scheduledAt ?? null,
        totalRecipients: totalRecipients,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    await db.insert(emailCampaign).values({
        id: randomUUID(),
        campaignId,
        fromName: data.fromName,
        fromEmail: data.fromEmail,
        replyTo: data.replyTo ?? null,
        utmSource: data.utmSource ?? null,
        utmMedium: data.utmMedium ?? null,
        utmCampaign: data.utmCampaign ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    // Store recipient rows in a draft blast job so scheduleCampaign can retrieve them later
    await db.insert(jobMarketingBlast).values({
        id: randomUUID(),
        campaignId,
        status: "draft",
        channel: "email",
        batchIndex: 0,
        batchSize: recipientRows.length,
        totalBatches: 1,
        attempt: 1,
        maxAttempts: 3,
        jobData: {recipientRows},
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    revalidatePath("/campaigns/email/campaigns");
    return campaignId;
}

export async function scheduleCampaign(campaignId: string, scheduledAt: Date) {
    const session = await fetchSession();

    // Get subscriber IDs for this campaign
    const campaign = await db
        .select()
        .from(marketingCampaign)
        .where(and(eq(marketingCampaign.id, campaignId), eq(marketingCampaign.userId, session.user.id)))
        .limit(1);
    if (!campaign[0])
        throw new Error("Campaign not found");

    // Retrieve recipients from the stored draft blast job
    const [draftJob] = await db
        .select()
        .from(jobMarketingBlast)
        .where(and(eq(jobMarketingBlast.campaignId, campaignId), eq(jobMarketingBlast.status, "draft")))
        .limit(1);

    type JobData = { recipientRows?: RecipientRow[]; subscriberIds?: string[] };
    const storedData = (draftJob?.jobData ?? {}) as JobData;
    const recipientRows: RecipientRow[] = storedData.recipientRows ?? [];
    const subscriberIds: string[] = storedData.subscriberIds ?? [];

    const totalRecipients = recipientRows.length || subscriberIds.length;
    if (totalRecipients === 0)
        throw new Error("Cannot schedule: No valid active recipients found. Please re-upload your recipient list.");

    await db
        .update(marketingCampaign)
        .set({scheduledAt, status: CAMPAIGN_STATUS.SCHEDULED, updatedAt: new Date()})
        .where(
            and(
                eq(marketingCampaign.id, campaignId),
                eq(marketingCampaign.userId, session.user.id)
            )
        );

    // Promote the draft job to waiting (or create a new one if coming from the list path)
    let blastJobId: string;
    if (draftJob) {
        blastJobId = draftJob.id;
        await db
            .update(jobMarketingBlast)
            .set({status: "waiting", scheduledAt, updatedAt: new Date()})
            .where(eq(jobMarketingBlast.id, draftJob.id));
    } else {
        blastJobId = randomUUID();
        await db.insert(jobMarketingBlast).values({
            id: blastJobId,
            campaignId,
            status: "waiting",
            channel: "email",
            batchIndex: 0,
            batchSize: totalRecipients,
            totalBatches: 1,
            scheduledAt,
            attempt: 1,
            maxAttempts: 3,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    // Enqueue in BullMQ — worker processes it
    const delay = Math.max(0, scheduledAt.getTime() - Date.now());
    await fetchEmailBlastQueue().add(
        "blast",
        {campaignId, blastJobId, batchIndex: 0, batchSize: totalRecipients, recipientRows, subscriberIds},
        {delay, jobId: blastJobId}
    );

    revalidatePath("/email/campaigns");
    revalidatePath(`/campaigns/email/campaigns/${campaignId}`);
}

export async function cloneEmailCampaign(campaignId: string): Promise<string> {
    const session = await fetchSession();

    const row = await fetchEmailCampaignById(campaignId);
    if (!row) throw new Error("Campaign not found");

    const src = row.marketing_campaign;
    const detail = row.email_campaign_detail;

    const newId = randomUUID();

    await db.insert(marketingCampaign).values({
        id: newId,
        userId: session.user.id,
        channel: src.channel,
        name: `${src.name} (Copy)`,
        status: CAMPAIGN_STATUS.DRAFT,
        templateId: src.templateId,
        listId: null,
        providerId: src.providerId,
        scheduledAt: null,
        totalRecipients: 0,
        sentCount: 0,
        deliveredCount: 0,
        openedCount: 0,
        clickedCount: 0,
        bouncedCount: 0,
        unsubscribedCount: 0,
        failedCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    await db.insert(emailCampaign).values({
        id: randomUUID(),
        campaignId: newId,
        fromName: detail.fromName,
        fromEmail: detail.fromEmail,
        replyTo: detail.replyTo,
        utmSource: detail.utmSource,
        utmMedium: detail.utmMedium,
        utmCampaign: detail.utmCampaign,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    revalidatePath("/email/campaigns");
    return newId;
}

export async function cancelCampaign(campaignId: string) {
    const session = await fetchSession();
    await db
        .update(marketingCampaign)
        .set({status: "cancelled", updatedAt: new Date()})
        .where(
            and(
                eq(marketingCampaign.id, campaignId),
                eq(marketingCampaign.userId, session.user.id)
            )
        );
    revalidatePath("/email/campaigns");
    revalidatePath(`/email/campaigns/${campaignId}`);
}

export async function updateEmailCampaign(
    id: string,
    formData: FormData
) {
    const session = await fetchSession();

    // 1. Extract standard data
    const name = formData.get("name") as string;
    const fromName = formData.get("fromName") as string;
    const fromEmail = formData.get("fromEmail") as string;
    const replyTo = formData.get("replyTo") as string;
    const templateId = formData.get("templateId") as string;
    const recipientRowsJson = formData.get("recipientRowsJson") as string;
    const utmSource = formData.get("utmSource") as string;
    const utmMedium = formData.get("utmMedium") as string;
    const utmCampaign = formData.get("utmCampaign") as string;

    // Extract Delivery Mode data
    const sendMode = formData.get("sendMode") as string;
    const scheduledAtStr = formData.get("scheduledAt") as string;

    // null = keep existing list; array = new file uploaded
    const newRecipientRows: RecipientRow[] | null = recipientRowsJson ? JSON.parse(recipientRowsJson) : null;

    if (!name || !fromName || !fromEmail || !templateId)
        throw new Error("Name, From Name, From Email, and Template are required.");

    // Process dates based on Delivery Mode
    let finalScheduledAt: Date | null = null;
    let finalStatus: string = CAMPAIGN_STATUS.DRAFT;

    if (sendMode === CAMPAIGN_SEND_MODE.NOW) {
        finalScheduledAt = new Date();
        finalStatus = CAMPAIGN_STATUS.SCHEDULED;
    } else if (sendMode === CAMPAIGN_SEND_MODE.SCHEDULE && scheduledAtStr) {
        finalScheduledAt = scheduledAtStr.endsWith('Z')
            ? new Date(scheduledAtStr)
            : parseFromAppTimezone(scheduledAtStr);
        finalStatus = CAMPAIGN_STATUS.SCHEDULED;
    }

    // 2. Safety & Lock Window Checks
    const currentCampaign = await db.select().from(marketingCampaign).where(eq(marketingCampaign.id, id)).limit(1);

    if (!currentCampaign[0]
        || currentCampaign[0].status === CAMPAIGN_STATUS.SENDING
        || currentCampaign[0].status === CAMPAIGN_STATUS.SENT)
        throw new Error("Cannot edit a campaign that is already being processed or sent.");

    // 15-Minute Lock Window Enforcement
    if (currentCampaign[0].status === CAMPAIGN_STATUS.SCHEDULED && currentCampaign[0].scheduledAt) {
        const now = new Date();
        const scheduledTime = new Date(currentCampaign[0].scheduledAt);
        const timeDiffMins = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);

        if (timeDiffMins <= 15 && timeDiffMins > 0)
            throw new Error("Campaign is locked. You cannot edit a campaign within 15 minutes of its scheduled send time. Please cancel the blast first.");

    }

    const validRecipientRows = newRecipientRows ? newRecipientRows.filter((r) => r.email.includes("@")) : null;
    const totalRecipients = validRecipientRows !== null
        ? validRecipientRows.length
        : currentCampaign[0].totalRecipients;

    // Hunt down any existing BullMQ jobs for this campaign in the "waiting" state
    const waitingJobs = await db.select().from(jobMarketingBlast).where(
        and(eq(jobMarketingBlast.campaignId, id), eq(jobMarketingBlast.status, "waiting"))
    );

    const queue = fetchEmailBlastQueue();

    // 3. Execute Database Transaction & Queue Management
    await db.transaction(async (tx) => {
        // Update the main campaign table
        await tx.update(marketingCampaign)
            .set({
                name,
                templateId,
                listId: null,
                status: finalStatus,
                scheduledAt: finalScheduledAt,
                totalRecipients: totalRecipients,
                updatedAt: new Date()
            })
            .where(
                and(
                    eq(marketingCampaign.id, id),
                    eq(marketingCampaign.userId, session.user.id)
                )
            );

        // Update the details table
        await tx.update(emailCampaign)
            .set({
                fromName,
                fromEmail,
                replyTo: replyTo || null,
                utmSource: utmSource || null,
                utmMedium: utmMedium || null,
                utmCampaign: utmCampaign || null,
                updatedAt: new Date(),
            })
            .where(eq(emailCampaign.campaignId, id));

        if (validRecipientRows !== null) {
            // New list uploaded — replace all existing blast jobs
            for (const job of waitingJobs) {
                await queue.remove(job.id);
                await tx.delete(jobMarketingBlast).where(eq(jobMarketingBlast.id, job.id));
            }
            await tx.delete(jobMarketingBlast).where(
                and(eq(jobMarketingBlast.campaignId, id), eq(jobMarketingBlast.status, "draft"))
            );

            if (finalStatus === CAMPAIGN_STATUS.SCHEDULED && finalScheduledAt) {
                if (validRecipientRows.length === 0)
                    throw new Error("Cannot schedule: No valid active recipients found in the uploaded list.");

                const blastJobId = randomUUID();
                await tx.insert(jobMarketingBlast).values({
                    id: blastJobId,
                    campaignId: id,
                    status: "waiting",
                    channel: "email",
                    batchIndex: 0,
                    batchSize: validRecipientRows.length,
                    totalBatches: 1,
                    scheduledAt: finalScheduledAt,
                    attempt: 1,
                    maxAttempts: 3,
                    jobData: {recipientRows: validRecipientRows},
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                const delay = Math.max(0, finalScheduledAt.getTime() - Date.now());
                await queue.add(
                    "blast",
                    {campaignId: id, blastJobId, batchIndex: 0, batchSize: validRecipientRows.length, recipientRows: validRecipientRows},
                    {delay, jobId: blastJobId}
                );
            } else {
                await tx.insert(jobMarketingBlast).values({
                    id: randomUUID(),
                    campaignId: id,
                    status: "draft",
                    channel: "email",
                    batchIndex: 0,
                    batchSize: validRecipientRows.length,
                    totalBatches: 1,
                    attempt: 1,
                    maxAttempts: 3,
                    jobData: {recipientRows: validRecipientRows},
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
        } else if (finalStatus === CAMPAIGN_STATUS.SCHEDULED && finalScheduledAt) {
            // No new list but user wants to schedule — promote existing draft job
            for (const job of waitingJobs) {
                await queue.remove(job.id);
                await tx.delete(jobMarketingBlast).where(eq(jobMarketingBlast.id, job.id));
            }
            const [existingDraft] = await tx
                .select()
                .from(jobMarketingBlast)
                .where(and(eq(jobMarketingBlast.campaignId, id), eq(jobMarketingBlast.status, "draft")))
                .limit(1);

            if (!existingDraft)
                throw new Error("Cannot schedule: No recipient list on file. Please upload a list first.");

            const blastJobId = existingDraft.id;
            await tx.update(jobMarketingBlast)
                .set({status: "waiting", scheduledAt: finalScheduledAt, updatedAt: new Date()})
                .where(eq(jobMarketingBlast.id, blastJobId));

            const storedRows = (existingDraft.jobData as any)?.recipientRows ?? [];
            const delay = Math.max(0, finalScheduledAt.getTime() - Date.now());
            await queue.add(
                "blast",
                {campaignId: id, blastJobId, batchIndex: 0, batchSize: storedRows.length, recipientRows: storedRows},
                {delay, jobId: blastJobId}
            );
        }
    });

    revalidatePath("/email/campaigns");
    revalidatePath(`/email/campaigns/${id}`);
}

async function fetchSubscriberIdsForList(listId: string): Promise<string[]> {
    const [targetList] = await db
        .select()
        .from(audience_segment)
        .where(eq(audience_segment.id, listId))
        .limit(1);

    if (!targetList)
        return [];

    if (targetList.type === "static") {             // STATIC LIST LOGIC ---
        const rows = await db
            .select({id: audienceSegmentMember.audienceId})
            .from(audienceSegmentMember)
            .where(eq(audienceSegmentMember.listId, listId));

        return rows.map((r) => r.id).filter(Boolean);
    } else if (targetList.type === "dynamic") {     // DYNAMIC SEGMENT LOGIC ---
        const rules = targetList.rules as any[];

        if (!rules || rules.length === 0)
            return [];

        const conditions: SQL[] = [];

        for (const rule of rules) {
            if (rule.type === "standard") {
                // Safely grab the column definition from the audience table schema
                const column = (audience as any)[rule.field];

                if (!column) continue; // Skip if field doesn't exist on audience table

                // Map your JSON operators to Drizzle SQL operators
                switch (rule.operator) {
                    case "equals":
                        conditions.push(eq(column, rule.value));
                        break;
                    case "not_equals":
                        conditions.push(ne(column, rule.value));
                        break;
                    case "contains":
                        conditions.push(ilike(column, `%${rule.value}%`));
                        break;
                }
            }
        }

        if (conditions.length === 0) return [];

        // Query the main audience table using the generated WHERE clauses (AND logic)
        const rows = await db
            .select({id: audience.id})
            .from(audience)
            .where(and(...conditions));

        return rows.map((r) => r.id).filter(Boolean);
    }

    return [];
}
