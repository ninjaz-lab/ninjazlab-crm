import {Queue} from "bullmq";

const connection = {
    url: process.env.REDIS_URL,
};

export type ContactImportJobData = { importJobId: string };

export type EmailBlastJobData = {
    campaignId: string;
    blastJobId: string;
    batchIndex: number;
    batchSize: number;
    subscriberIds: string[];
};

// Lazy singletons — only connect to Redis when first used (not at import time / build time)
let _contactImportQueue: Queue | null = null;
let _emailBlastQueue: Queue | null = null;
let _smsBlastQueue: Queue | null = null;
let _pushBlastQueue: Queue | null = null;

export function getAudienceImportQueue(): Queue {
    if (!_contactImportQueue) _contactImportQueue = new Queue("audience-import", {connection});
    return _contactImportQueue;
}

export function getEmailBlastQueue(): Queue {
    if (!_emailBlastQueue) _emailBlastQueue = new Queue("email-blast", {connection});
    return _emailBlastQueue;
}

export function getSmsBlastQueue(): Queue {
    if (!_smsBlastQueue) _smsBlastQueue = new Queue("sms-blast", {connection});
    return _smsBlastQueue;
}

export function getPushBlastQueue(): Queue {
    if (!_pushBlastQueue) _pushBlastQueue = new Queue("push-blast", {connection});
    return _pushBlastQueue;
}

