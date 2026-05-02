import {DefaultJobOptions, Queue} from "bullmq";

const connection = {
    url: process.env.REDIS_URL,
};

export type ContactImportJobData = { importJobId: string };

export type RecipientRow = { email: string; firstName?: string; lastName?: string };
export type SmsRecipientRow = { phone: string; name?: string };

export type EmailBlastJobData = {
    campaignId: string;
    blastJobId: string;
    batchIndex: number;
    batchSize: number;
    // CSV-upload path — no audience table involved
    recipientRows?: RecipientRow[];
    // Segment/list path (future) — audience UUIDs
    subscriberIds?: string[];
};

const defaultOptions: DefaultJobOptions = {
    attempts: 5, // Try up to 5 times before failing
    backoff: {
        type: "exponential",
        delay: 5000, // Waits 5s, 25s, ~2m, ~10m between failures
    },
    removeOnComplete: true, // Keep successful jobs out of Redis/Dashboard
    removeOnFail: false,    // KEEP failed jobs so you can manually retry/view them in the UI
};

// Lazy singletons — only connect to Redis when first used (not at import time / build time)
let _contactImportQueue: Queue | null = null;
let _emailBlastQueue: Queue | null = null;
let _smsBlastQueue: Queue | null = null;
let _pushBlastQueue: Queue | null = null;

export function getAudienceImportQueue(): Queue {
    if (!_contactImportQueue)
        _contactImportQueue = new Queue("audience-import", {
            connection,
            defaultJobOptions: defaultOptions
        });
    return _contactImportQueue;
}

export function fetchEmailBlastQueue(): Queue {
    if (!_emailBlastQueue)
        _emailBlastQueue = new Queue("email-blast", {
            connection,
            defaultJobOptions: defaultOptions
        });
    return _emailBlastQueue;
}

export function getSmsBlastQueue(): Queue {
    if (!_smsBlastQueue)
        _smsBlastQueue = new Queue("sms-blast", {
            connection,
            defaultJobOptions: defaultOptions
        });
    return _smsBlastQueue;
}

export function getPushBlastQueue(): Queue {
    if (!_pushBlastQueue)
        _pushBlastQueue = new Queue("push-blast", {
            connection,
            defaultJobOptions: defaultOptions
        });
    return _pushBlastQueue;
}
