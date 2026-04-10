export const USER_ROLES = {
    ADMIN: "admin",
    USER: "user",
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const WALLET_TYPES = {
    MAIN: "main",
} as const;

export const TRANSACTION_TYPES = {
    CREDIT: "credit",
    DEBIT: "debit",
} as const;

export const TRANSACTION_MODULES = {
    SYSTEM: "system_adjustment",
    EMAIL: "email_marketing",
    SMS: "sms_marketing",
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

// Pagination defaults
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 50,
}
