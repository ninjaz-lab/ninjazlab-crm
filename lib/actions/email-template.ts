"use server"

import {getSession} from "@/lib/session";
import {db} from "@/lib/db";
import {and, desc, eq} from "drizzle-orm";
import {randomUUID} from "crypto";
import {CAMPAIGN_STATUS} from "@/lib/enums";
import {revalidatePath} from "next/cache";
import {emailTemplateDetail, marketingTemplate} from "@/lib/db/schema";

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
            htmlBody: emailTemplateDetail.htmlBody,
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

export async function fetchEmailTemplateById(id: string) {
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
        status: CAMPAIGN_STATUS.DRAFT,
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
        status?: typeof CAMPAIGN_STATUS.DRAFT | typeof CAMPAIGN_STATUS.PUBLISHED;
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

export async function cloneEmailTemplate(templateId: string) {
    const session = await getSession();

    // 1. Fetch the existing template
    const existing = await fetchEmailTemplateById(templateId);
    if (!existing)
        throw new Error("Template not found");

    const newTemplateId = randomUUID();

    // 2. Insert duplicate into marketingTemplate
    await db.insert(marketingTemplate).values({
        id: newTemplateId,
        userId: session.user.id,
        channel: "email",
        name: `${existing.marketing_template.name} (Copy)`,
        status: CAMPAIGN_STATUS.DRAFT, // Clones always start as Drafts
        editorType: existing.marketing_template.editorType,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    // 3. Insert duplicate into emailTemplateDetail
    await db.insert(emailTemplateDetail).values({
        id: randomUUID(),
        templateId: newTemplateId,
        subject: existing.email_template_detail.subject,
        previewText: existing.email_template_detail.previewText,
        htmlBody: existing.email_template_detail.htmlBody,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    revalidatePath("/marketing/email/templates");
    return newTemplateId;
}
