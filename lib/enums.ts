// ----- Users
export const USER_ROLES = {
    SUPERADMIN: "superadmin",
    ADMIN: "admin",
    USER: "user",
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// ----- Audiences
export const AUDIENCE_SOURCE = {
    MANUAL: "manual",
    IMPORT: "import",
    API: "api",
} as const;

export const CHANNEL_STATUS = {
    SUBSCRIBED: "subscribed",
    UNSUBSCRIBED: "unsubscribed",
    BOUNCED: "bounced",       // Email/Phone is dead or invalid
    COMPLAINED: "complained", // User marked the email as SPAM
} as const;

// BULLMQ
export const IMPORT_JOB_STATUS = {
    QUEUED: "queued",
    PROCESSING: "processing",
    DONE: "done",
    FAILED: "failed",
} as const;

// ----- Wallets
export const WALLET_TYPES = {
    MAIN: "main",
} as const;

// ----- Campaigns
export const CAMPAIGN_TYPE = {
    EMAIL: "email",
    SMS: "sms",
} as const;

export type CampaignType = typeof CAMPAIGN_TYPE[keyof typeof CAMPAIGN_TYPE];

export const SMS_PROVIDER = {
    MACROKIOSK: "macrokiosk",
} as const;

export const EMAIL_PROVIDER = {
    SES: "ses",
} as const;

export const CAMPAIGN_STATUS = {
    DRAFT: "draft",
    PUBLISHED: "published",
    SCHEDULED: "scheduled",
    SENDING: "sending",
    SENT: "sent",
    PAUSED: "paused",
    COMPLETED: "completed",
} as const;

export type CampaignStatus = typeof CAMPAIGN_STATUS[keyof typeof CAMPAIGN_STATUS];

export const CAMPAIGN_SEND_MODE = {
    NOW: "now",
    SCHEDULE: "schedule",
} as const;

// ----- Wallet Transactions
export const TRANSACTION_STATUS = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
    FAILED: "failed",
} as const;

export const TRANSACTION_TYPES = {
    CREDIT: "credit",
    DEBIT: "debit",
} as const;

export const TRANSACTION_CAMPAIGN = {
    SYSTEM: "system_adjustment",
    EMAIL: CAMPAIGN_TYPE.EMAIL,
    SMS: CAMPAIGN_TYPE.SMS,
    // PUSH_NOTIFICATION: "push_notification_marketing"
} as const;

export const TRANSACTION_MODULE_LABELS: Record<string, string> = {
    [TRANSACTION_CAMPAIGN.SYSTEM]: "System Adjustment",
    [TRANSACTION_CAMPAIGN.EMAIL]: "Email Campaign",
    [TRANSACTION_CAMPAIGN.SMS]: "SMS Campaign",
    // [TRANSACTION_MODULES.PUSH_NOTIFICATION]: "Push Notifications Campaigns",
};

// Pagination defaults
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 50,
}
