"use server";

import {db} from "@/lib/db";
import {audienceListMember, emailCampaignDetail, jobMarketingBlast, marketingCampaign,} from "@/lib/db/schema";
import {and, count, desc, eq} from "drizzle-orm";
import {revalidatePath} from "next/cache";
import {randomUUID} from "crypto";
import {getEmailBlastQueue} from "@/lib/queue";
import {CAMPAIGN_SEND_MODE, CAMPAIGN_STATUS} from "@/lib/enums";
import {getSession} from "@/lib/session";

export async function fetchEmailCampaigns() {
    const session = await getSession();
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
            fromName: emailCampaignDetail.fromName,
            fromEmail: emailCampaignDetail.fromEmail,
        })
        .from(marketingCampaign)
        .leftJoin(
            emailCampaignDetail,
            eq(emailCampaignDetail.campaignId, marketingCampaign.id)
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
    const session = await getSession();
    const [row] = await db
        .select()
        .from(marketingCampaign)
        .innerJoin(
            emailCampaignDetail,
            eq(emailCampaignDetail.campaignId, marketingCampaign.id)
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
    listId: string;
    providerId?: string;
    scheduledAt?: Date;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
}) {
    const session = await getSession();
    const campaignId = randomUUID();

    // Count contacts in segment
    const [result] = await db
        .select({
            count: count()
        })
        .from(audienceListMember)
        .where(eq(audienceListMember.listId, data.listId));

    const totalRecipients = result?.count ?? 0;

    await db.insert(marketingCampaign).values({
        id: campaignId,
        userId: session.user.id,
        channel: "email",
        name: data.name,
        status: data.scheduledAt ? CAMPAIGN_STATUS.SCHEDULED : CAMPAIGN_STATUS.DRAFT,
        templateId: data.templateId,
        listId: data.listId,
        providerId: data.providerId ?? null,
        scheduledAt: data.scheduledAt ?? null,
        totalRecipients: totalRecipients,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    await db.insert(emailCampaignDetail).values({
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

    revalidatePath("/campaigns/email/campaigns");
    return campaignId;
}

export async function scheduleCampaign(campaignId: string, scheduledAt: Date) {
    const session = await getSession();

    // Get subscriber IDs for this campaign
    const campaign = await db
        .select()
        .from(marketingCampaign)
        .where(and(eq(marketingCampaign.id, campaignId), eq(marketingCampaign.userId, session.user.id)))
        .limit(1);
    if (!campaign[0]) throw new Error("Campaign not found");

    const subscriberRows = await db
        .select({subscriberId: audienceListMember.audienceId})
        .from(audienceListMember)
        .where(eq(audienceListMember.listId, campaign[0].listId!));

    const subscriberIds = subscriberRows.map((r) => r.subscriberId);

    await db
        .update(marketingCampaign)
        .set({scheduledAt, status: CAMPAIGN_STATUS.SCHEDULED, updatedAt: new Date()})
        .where(
            and(
                eq(marketingCampaign.id, campaignId),
                eq(marketingCampaign.userId, session.user.id)
            )
        );

    const blastJobId = randomUUID();
    await db.insert(jobMarketingBlast).values({
        id: blastJobId,
        campaignId,
        status: "waiting",
        channel: "email",
        batchIndex: 0,
        batchSize: subscriberIds.length,
        totalBatches: 1,
        scheduledAt,
        attempt: 1,
        maxAttempts: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    // Enqueue in BullMQ — worker processes it
    const delay = Math.max(0, scheduledAt.getTime() - Date.now());
    await getEmailBlastQueue().add(
        "blast",
        {campaignId, blastJobId, batchIndex: 0, batchSize: subscriberIds.length, subscriberIds},
        {delay, jobId: blastJobId}
    );

    revalidatePath("/email/campaigns");
    revalidatePath(`/campaigns/email/campaigns/${campaignId}`);
}

export async function cancelCampaign(campaignId: string) {
    const session = await getSession();
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
    const session = await getSession();

    // 1. Extract standard data
    const name = formData.get("name") as string;
    const fromName = formData.get("fromName") as string;
    const fromEmail = formData.get("fromEmail") as string;
    const replyTo = formData.get("replyTo") as string;
    const templateId = formData.get("templateId") as string;
    const listId = formData.get("listId") as string;
    const utmSource = formData.get("utmSource") as string;
    const utmMedium = formData.get("utmMedium") as string;
    const utmCampaign = formData.get("utmCampaign") as string;

    // Extract Delivery Mode data
    const sendMode = formData.get("sendMode") as string;
    const scheduledAtStr = formData.get("scheduledAt") as string;

    if (!name || !fromName || !fromEmail || !templateId || !listId)
        throw new Error("Name, From Name, From Email, Template, and Segment are required.");

    // Process dates based on Delivery Mode
    let finalScheduledAt: Date | null = null;
    let finalStatus: string = CAMPAIGN_STATUS.DRAFT;

    if (sendMode === CAMPAIGN_SEND_MODE.NOW) {
        finalScheduledAt = new Date();
        finalStatus = CAMPAIGN_STATUS.SCHEDULED;
    } else if (sendMode === CAMPAIGN_SEND_MODE.SCHEDULE && scheduledAtStr) {
        finalScheduledAt = new Date(scheduledAtStr);
        finalStatus = CAMPAIGN_STATUS.SCHEDULED;
    }

    // 2. Safety & Lock Window Checks
    const currentCampaign = await db.select().from(marketingCampaign).where(eq(marketingCampaign.id, id)).limit(1);

    if (!currentCampaign[0] || currentCampaign[0].status === CAMPAIGN_STATUS.SENDING || currentCampaign[0].status === CAMPAIGN_STATUS.SENT) {
        throw new Error("Cannot edit a campaign that is already being processed or sent.");
    }

    // 15-Minute Lock Window Enforcement
    if (currentCampaign[0].status === CAMPAIGN_STATUS.SCHEDULED && currentCampaign[0].scheduledAt) {
        const now = new Date();
        const scheduledTime = new Date(currentCampaign[0].scheduledAt);
        const timeDiffMins = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);

        if (timeDiffMins <= 15 && timeDiffMins > 0)
            throw new Error("Campaign is locked. You cannot edit a campaign within 15 minutes of its scheduled send time. Please cancel the blast first.");

    }

    // Recalculate recipient count
    const [result] = await db
        .select({
            count: count()
        })
        .from(audienceListMember)
        .where(eq(audienceListMember.listId, listId));

    const totalRecipients = result?.count ?? 0;

    // Hunt down any existing BullMQ jobs for this campaign in the "waiting" state
    const waitingJobs = await db.select().from(jobMarketingBlast).where(
        and(eq(jobMarketingBlast.campaignId, id), eq(jobMarketingBlast.status, "waiting"))
    );

    const queue = getEmailBlastQueue();

    // 3. Execute Database Transaction & Queue Management
    await db.transaction(async (tx) => {
        // Update the main campaign table
        await tx.update(marketingCampaign)
            .set({
                name,
                templateId,
                listId,
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
        await tx.update(emailCampaignDetail)
            .set({
                fromName,
                fromEmail,
                replyTo: replyTo || null,
                utmSource: utmSource || null,
                utmMedium: utmMedium || null,
                utmCampaign: utmCampaign || null,
                updatedAt: new Date(),
            })
            .where(eq(emailCampaignDetail.campaignId, id));

        // Queue Management: Clear out old jobs
        for (const job of waitingJobs) {
            await queue.remove(job.id); // Destroy it in BullMQ Redis
            await tx.delete(jobMarketingBlast).where(eq(jobMarketingBlast.id, job.id)); // Clear from DB
        }

        // Queue Management: Create a new job if they want to send it now or schedule it
        if (finalStatus === CAMPAIGN_STATUS.SCHEDULED && finalScheduledAt) {
            const subscriberRows = await tx
                .select({subscriberId: audienceListMember.audienceId})
                .from(audienceListMember)
                .where(eq(audienceListMember.listId, listId));

            const subscriberIds = subscriberRows.map((r) => r.subscriberId);
            const blastJobId = randomUUID();

            await tx.insert(jobMarketingBlast).values({
                id: blastJobId,
                campaignId: id,
                status: "waiting",
                channel: "email",
                batchIndex: 0,
                batchSize: subscriberIds.length,
                totalBatches: 1,
                scheduledAt: finalScheduledAt,
                attempt: 1,
                maxAttempts: 3,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            // Re-add to BullMQ with the exact delayed timer
            const delay = Math.max(0, finalScheduledAt.getTime() - Date.now());
            await queue.add(
                "blast",
                {campaignId: id, blastJobId, batchIndex: 0, batchSize: subscriberIds.length, subscriberIds},
                {delay, jobId: blastJobId}
            );
        }
    });

    revalidatePath("/email/campaigns");
    revalidatePath(`/email/campaigns/${id}`);
}

