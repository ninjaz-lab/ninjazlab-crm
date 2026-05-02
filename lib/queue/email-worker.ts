/**
 * Email blast worker — run this as a standalone Node process:
 *   npx tsx lib/queue/email-worker.ts
 *
 * In production: use a separate worker dyno/container.
 * This file is NOT imported by Next.js — it runs outside the app server.
 */

import {type Job, Worker} from "bullmq";
import nodemailer from "nodemailer";
import {SendEmailCommand, SESClient} from "@aws-sdk/client-ses";
import {randomUUID} from "crypto";
import {and, eq, inArray} from "drizzle-orm";
import type {EmailBlastJobData, RecipientRow} from "./index";
import {db} from "@/lib/db";
import {
    audience,
    emailCampaign,
    emailTemplate,
    jobMarketingBlast,
    marketingCampaign,
    marketingProvider,
    marketingSendLog,
    marketingTemplate,
} from "@/lib/db/schema";
import {CAMPAIGN_STATUS, CAMPAIGN_TYPE} from "@/lib/enums";
import {chargeForSend} from "@/lib/pricing";

const redisUrl = new URL(process.env.REDIS_URL || "redis://127.0.0.1:6379");

const connection = {
    host: redisUrl.hostname,
    port: Number(redisUrl.port),
    username: redisUrl.username || undefined,
    password: redisUrl.password || undefined,
    // Automatically enable TLS if you are using an Upstash/AWS rediss:// URL
    tls: redisUrl.protocol === "rediss:" ? {} : undefined,
};

type ProviderConfig = Record<string, string>;

type SendParams = {
    from: string;
    replyTo?: string;
    to: string;
    subject: string;
    html: string;
};

async function loadSystemProviderConfig(channel: string): Promise<ProviderConfig> {
    const {isNull} = await import("drizzle-orm");
    const [provider] = await db
        .select()
        .from(marketingProvider)
        .where(
            and(
                isNull(marketingProvider.userId),
                eq(marketingProvider.channel, channel),
                eq(marketingProvider.isDefault, true)
            )
        )
        .limit(1);
    if (!provider) throw new Error(`No default system provider configured for channel: ${channel}`);
    return provider.config as ProviderConfig;
}

async function sendViaSes(config: ProviderConfig, params: SendParams) {
    const ses = new SESClient({
        region: config.region,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
    });
    const cmd = new SendEmailCommand({
        Source: params.from,
        ReplyToAddresses: params.replyTo ? [params.replyTo] : undefined,
        Destination: {ToAddresses: [params.to]},
        Message: {
            Subject: {Data: params.subject, Charset: "UTF-8"},
            Body: {Html: {Data: params.html, Charset: "UTF-8"}},
        },
    });
    const result = await ses.send(cmd);
    return result.MessageId ?? "";
}

async function sendViaSmtp(
    config: ProviderConfig,
    params: SendParams,
    smtpHost?: string
): Promise<string> {
    const transporter = nodemailer.createTransport({
        host: smtpHost ?? config.host,
        port: Number(config.port ?? 587),
        secure: (config.port ?? "587") === "465",
        auth: {user: config.user, pass: config.pass},
    });
    const info = await transporter.sendMail({
        from: params.from,
        replyTo: params.replyTo,
        to: params.to,
        subject: params.subject,
        html: params.html,
    });
    return info.messageId ?? "";
}

async function sendEmail(config: ProviderConfig, params: SendParams): Promise<string> {
    if (config.type === "ses") return sendViaSes(config, params);
    if (config.type === "resend") {
        return sendViaSmtp(
            {...config, host: "smtp.resend.com", port: "465", user: "resend", pass: config.apiKey},
            params,
            "smtp.resend.com"
        );
    }
    return sendViaSmtp(config, params);
}

async function processEmailBlast(job: Job<EmailBlastJobData>) {
    const {campaignId, blastJobId, recipientRows, subscriberIds} = job.data;

    // Mark blast job as active
    await db
        .update(jobMarketingBlast)
        .set({status: "active", startedAt: new Date(), updatedAt: new Date()})
        .where(eq(jobMarketingBlast.id, blastJobId));

    // Load campaign + detail + template
    const [campaignRow] = await db
        .select()
        .from(marketingCampaign)
        .innerJoin(emailCampaign, eq(emailCampaign.campaignId, marketingCampaign.id))
        .where(eq(marketingCampaign.id, campaignId))
        .limit(1);

    if (!campaignRow) throw new Error("Campaign not found");

    const [templateRow] = await db
        .select()
        .from(marketingTemplate)
        .innerJoin(emailTemplate, eq(emailTemplate.templateId, marketingTemplate.id))
        .where(eq(marketingTemplate.id, campaignRow.marketing_campaign.templateId!))
        .limit(1);

    if (!templateRow) throw new Error("Template not found");

    const providerConfig = await loadSystemProviderConfig("email");

    // Resolve recipients: CSV-upload path or legacy audience-table path
    let recipients: RecipientRow[];
    if (recipientRows && recipientRows.length > 0) {
        recipients = recipientRows;
    } else if (subscriberIds && subscriberIds.length > 0) {
        const contacts = await db.select().from(audience).where(inArray(audience.id, subscriberIds));
        recipients = contacts.map((c) => ({
            email: c.email ?? "",
            firstName: c.firstName ?? undefined,
            lastName: c.lastName ?? undefined,
        }));
    } else {
        recipients = [];
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
        const sendLogId = randomUUID();

        await db.insert(marketingSendLog).values({
            id: sendLogId,
            campaignId,
            subscriberId: null,
            recipientEmail: recipient.email,
            status: "pending",
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        try {
            if (!recipient.email)
                throw new Error("Recipient has no valid email address.");

            // Simple variable substitution: {{firstName}}, {{lastName}}, {{email}}
            const html = templateRow.email_template_detail.htmlBody
                .replace(/\{\{firstName\}\}/g, recipient.firstName ?? "")
                .replace(/\{\{lastName\}\}/g, recipient.lastName ?? "")
                .replace(/\{\{email\}\}/g, recipient.email ?? "");

            const subject = templateRow.email_template_detail.subject
                .replace(/\{\{firstName\}\}/g, recipient.firstName ?? "")
                .replace(/\{\{lastName\}\}/g, recipient.lastName ?? "");

            const messageId = await sendEmail(providerConfig, {
                from: `"${campaignRow.email_campaign_detail.fromName}" <${campaignRow.email_campaign_detail.fromEmail}>`,
                replyTo: campaignRow.email_campaign_detail.replyTo ?? undefined,
                to: recipient.email,
                subject,
                html,
            });

            await db
                .update(marketingSendLog)
                .set({
                    status: "sent",
                    providerMessageId: messageId,
                    sentAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(marketingSendLog.id, sendLogId));

            sentCount++;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            await db
                .update(marketingSendLog)
                .set({
                    status: "failed",
                    errorMessage: message,
                    updatedAt: new Date(),
                })
                .where(eq(marketingSendLog.id, sendLogId));

            failedCount++;
        }

        // Brief throttle to avoid rate limits
        await new Promise((r) => setTimeout(r, 50));
    }

    // Mark blast job complete
    await db
        .update(jobMarketingBlast)
        .set({status: CAMPAIGN_STATUS.COMPLETED, completedAt: new Date(), updatedAt: new Date()})
        .where(eq(jobMarketingBlast.id, blastJobId));

    // Update campaign aggregate counts
    await db
        .update(marketingCampaign)
        .set({
            sentCount,
            failedCount,
            status: "sent",
            completedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(marketingCampaign.id, campaignId));

    // Deduct from user's billing for successful sends
    if (sentCount > 0) {
        try {
            await chargeForSend({
                userId: campaignRow.marketing_campaign.userId,
                campaign: CAMPAIGN_TYPE.EMAIL,
                units: sentCount,
                referenceId: campaignId,
                note: `Email campaign: ${campaignRow.marketing_campaign.name} (${sentCount} sent)`,
            });
        } catch (err) {
            // Billing failure should not fail the job — log and continue
            console.error("[email-worker] Billing charge failed:", err);
        }
    }

    return {sentCount, failedCount};
}

const worker = new Worker<EmailBlastJobData>(
    "email-blast",
    processEmailBlast,
    {
        connection,
        concurrency: 5,
    }
);

worker.on(CAMPAIGN_STATUS.COMPLETED, (job, result) => {
    console.log(`[email-worker] Job ${job.id} completed`, result);
});

worker.on("failed", (job, err) => {
    console.error(`[email-worker] Job ${job?.id} failed:`, err.message);
});

console.log("[email-worker]  Worker initialized and waiting for jobs...");
