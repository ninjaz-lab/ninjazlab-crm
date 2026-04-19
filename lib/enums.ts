// ----- Users
export const USER_ROLES = {
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

// ----- Wallet Transactions
export const TRANSACTION_STATUS = {
    PENDING: "pending",
    COMPLETED: "completed",
    FAILED: "failed",
} as const;

export const TRANSACTION_TYPES = {
    CREDIT: "credit",
    DEBIT: "debit",
} as const;

export const TRANSACTION_MODULES = {
    SYSTEM: "system_adjustment",
    EMAIL: "email_marketing",
    SMS: "sms_marketing",
    // PUSH_NOTIFICATION: "push_notification_marketing"
} as const;

export const TRANSACTION_MODULE_LABELS: Record<string, string> = {
    [TRANSACTION_MODULES.SYSTEM]: "System Adjustment",
    [TRANSACTION_MODULES.EMAIL]: "Email Marketing",
    [TRANSACTION_MODULES.SMS]: "SMS Marketing",
    // [TRANSACTION_MODULES.PUSH_NOTIFICATION]: "Push Notifications Marketing",
};

// ----- Campaigns
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

// Pagination defaults
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 50,
}
