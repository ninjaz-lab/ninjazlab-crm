"use server";

import {db} from "@/lib/db";
import {
    audienceListMember,
    emailCampaignDetail,
    emailTemplateDetail,
    jobMarketingBlast,
    marketingCampaign,
    marketingProvider,
    marketingTemplate,
} from "@/lib/db/schema";
import {and, desc, eq, isNull, sql} from "drizzle-orm";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {revalidatePath} from "next/cache";
import {randomUUID} from "crypto";
import {getEmailBlastQueue} from "@/lib/queue";

async function getSession() {
    const session = await auth.api.getSession({headers: await headers()});
    if (!session) throw new Error("Unauthorized");
    return session;
}

// ─── Templates ────────────────────────────────────────────────────────────

export async function fetchEmailTemplates() {
    const session = await getSession();
    return db
        .select({
            id: marketingTemplate.id,
            name: marketingTemplate.name,
            status: marketingTemplate.status,
            editorType: marketingTemplate.editorType,
            createdAt: marketingTemplate.createdAt,
            updatedAt: marketingTemplate.updatedAt,
            subject: emailTemplateDetail.subject,
            previewText: emailTemplateDetail.previewText,
        })
        .from(marketingTemplate)
        .leftJoin(
            emailTemplateDetail,
            eq(emailTemplateDetail.templateId, marketingTemplate.id)
        )
        .where(
            and(
                eq(marketingTemplate.userId, session.user.id),
                eq(marketingTemplate.channel, "email")
            )
        )
        .orderBy(desc(marketingTemplate.updatedAt));
}

export async function getEmailTemplate(id: string) {
    const session = await getSession();
    const [row] = await db
        .select()
        .from(marketingTemplate)
        .innerJoin(
            emailTemplateDetail,
            eq(emailTemplateDetail.templateId, marketingTemplate.id)
        )
        .where(
            and(
                eq(marketingTemplate.id, id),
                eq(marketingTemplate.userId, session.user.id)
            )
        )
        .limit(1);
    return row ?? null;
}

export async function createEmailTemplate(data: {
    name: string;
    subject: string;
    previewText?: string;
    htmlBody: string;
}) {
    const session = await getSession();
    const templateId = randomUUID();

    await db.insert(marketingTemplate).values({
        id: templateId,
        userId: session.user.id,
        channel: "email",
        name: data.name,
        status: "draft",
        editorType: "html",
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    await db.insert(emailTemplateDetail).values({
        id: randomUUID(),
        templateId,
        subject: data.subject,
        previewText: data.previewText ?? null,
        htmlBody: data.htmlBody,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    revalidatePath("/marketing/email/templates");
    return templateId;
}

export async function updateEmailTemplate(
    id: string,
    data: {
        name?: string;
        subject?: string;
        previewText?: string;
        htmlBody?: string;
        status?: "draft" | "published";
    }
) {
    const session = await getSession();

    if (data.name || data.status) {
        await db
            .update(marketingTemplate)
            .set({
                ...(data.name && {name: data.name}),
                ...(data.status && {status: data.status}),
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(marketingTemplate.id, id),
                    eq(marketingTemplate.userId, session.user.id)
                )
            );
    }

    if (data.subject || data.previewText !== undefined || data.htmlBody) {
        await db
            .update(emailTemplateDetail)
            .set({
                ...(data.subject && {subject: data.subject}),
                ...(data.previewText !== undefined && {previewText: data.previewText}),
                ...(data.htmlBody && {htmlBody: data.htmlBody}),
                updatedAt: new Date(),
            })
            .where(eq(emailTemplateDetail.templateId, id));
    }

    revalidatePath("/marketing/email/templates");
    revalidatePath(`/marketing/email/templates/${id}`);
}

export async function deleteEmailTemplate(id: string) {
    const session = await getSession();
    await db
        .delete(marketingTemplate)
        .where(
            and(
                eq(marketingTemplate.id, id),
                eq(marketingTemplate.userId, session.user.id)
            )
        );
    revalidatePath("/marketing/email/templates");
}

// ─── Campaigns ────────────────────────────────────────────────────────────

export async function getEmailCampaigns() {
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

export async function getEmailCampaign(id: string) {
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
    const [{count}] = await db
        .select({count: sql<number>`count(*)`})
        .from(audienceListMember)
        .where(eq(audienceListMember.listId, data.listId));

    await db.insert(marketingCampaign).values({
        id: campaignId,
        userId: session.user.id,
        channel: "email",
        name: data.name,
        status: data.scheduledAt ? "scheduled" : "draft",
        templateId: data.templateId,
        listId: data.listId,
        providerId: data.providerId ?? null,
        scheduledAt: data.scheduledAt ?? null,
        totalRecipients: Number(count),
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

    revalidatePath("/marketing/email/campaigns");
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
        .select({ subscriberId: audienceListMember.audienceId })
        .from(audienceListMember)
        .where(eq(audienceListMember.listId, campaign[0].listId!));

    const subscriberIds = subscriberRows.map((r) => r.subscriberId);

    await db
        .update(marketingCampaign)
        .set({ scheduledAt, status: "scheduled", updatedAt: new Date() })
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
        { campaignId, blastJobId, batchIndex: 0, batchSize: subscriberIds.length, subscriberIds },
        { delay, jobId: blastJobId }
    );

    revalidatePath("/marketing/email/campaigns");
    revalidatePath(`/marketing/email/campaigns/${campaignId}`);
}

export async function cancelCampaign(campaignId: string) {
    const session = await getSession();
    await db
        .update(marketingCampaign)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(
            and(
                eq(marketingCampaign.id, campaignId),
                eq(marketingCampaign.userId, session.user.id)
            )
        );
    revalidatePath("/marketing/email/campaigns");
    revalidatePath(`/marketing/email/campaigns/${campaignId}`);
}


// ─── System provider lookup (used internally by worker + campaign form) ───

export async function getSystemEmailProvider() {
    const [provider] = await db
        .select()
        .from(marketingProvider)
        .where(
            and(
                isNull(marketingProvider.userId),
                eq(marketingProvider.channel, "email"),
                eq(marketingProvider.isDefault, true)
            )
        )
        .limit(1);
    return provider ?? null;
}

