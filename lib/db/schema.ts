import {boolean, decimal, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid,} from "drizzle-orm/pg-core";
import {CAMPAIGN_STATUS, USER_ROLES, WALLET_TYPES} from "@/lib/enums";

// ─────────────────────────────────────────────
// AUTH TABLES
// ─────────────────────────────────────────────

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
    role: text("role").default(USER_ROLES.USER),
    banned: boolean("banned").default(false),
    banReason: text("ban_reason"),
    banExpires: timestamp("ban_expires"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, {onDelete: "cascade"}),
    impersonatedBy: text("impersonated_by"),
});

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, {onDelete: "cascade"}),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
});

// ─────────────────────────────────────────────
//  MODULE PERMISSIONS & BILLING
// ─────────────────────────────────────────────

export const appModule = pgTable("app_module", {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text("key").notNull().unique(),
    title: text("title").notNull(),
    href: text("href").notNull(),
    iconName: text("icon_name").notNull(),
    scope: text("scope").notNull().default(USER_ROLES.USER),
    exact: boolean("exact").default(false),
    description: text("description"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userPermission = pgTable("user_permission", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, {onDelete: "cascade"}),
    moduleId: uuid("module_id")
        .notNull()
        .references(() => appModule.id, {onDelete: "cascade"}),
    enabled: boolean("enabled").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pricingRule = pgTable("pricing_rule", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").references(() => user.id, {onDelete: "cascade"}), // null = default
    module: text("module").notNull(),   // 'email_marketing' | 'sms_marketing' | 'push_marketing'
    action: text("action").notNull().default("send"), // 'send' — expand later
    unitPrice: decimal("unit_price", {precision: 10, scale: 6}).notNull(), // e.g. '0.001000'
    currency: text("currency").notNull().default("USD"),
    effectiveFrom: timestamp("effective_from").notNull(), // when this rate activates
    note: text("note"),                 // admin note, e.g. "Enterprise tier — Q2 2026"
    createdBy: text("created_by").references(() => user.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notification = pgTable("notification", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, {onDelete: "cascade"}),
    type: text("type").notNull(), // e.g., 'import_success', 'billing_alert', 'system'
    title: text("title").notNull(),
    message: text("message").notNull(),
    actionUrl: text("action_url"), // Optional link (e.g., "/audience" or "/billing")
    readAt: timestamp("read_at"), // Null means unread!
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─────────────────────────────────────────────
// AUDIENCE (CRM) — Single Source of Truth
// ─────────────────────────────────────────────

export type AudienceSource = "manual" | "import" | "api";

export const audience = pgTable("audience", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, {onDelete: "cascade"}),
    firstName: text("first_name"),
    lastName: text("last_name"),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    city: text("city"),
    state: text("state"),
    country: text("country"),
    postalCode: text("postal_code"),
    notes: text("notes"),
    customFields: jsonb("custom_fields").default({}),

    // Marketing status flags right on the audience
    emailStatus: text("email_status").notNull().default("subscribed"), // subscribed, unsubscribed, bounced
    phoneStatus: text("phone_status").notNull().default("subscribed"), // subscribed, unsubscribed, bounced

    source: text("source").notNull().default("manual"), // AudienceSource
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const audienceList = pgTable("audience_list", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, {onDelete: "cascade"}),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color").default("#6366f1"),

    // Dynamic Segment Support
    type: text("type").notNull().default("static"), // 'static' or 'dynamic'
    rules: jsonb("rules").default([]),

    count: integer("count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const audienceListMember = pgTable("audience_list_member", {
    id: uuid("id").defaultRandom().primaryKey(),
    listId: uuid("list_id")
        .notNull()
        .references(() => audienceList.id, {onDelete: "cascade"}),
    audienceId: uuid("audience_id")
        .notNull()
        .references(() => audience.id, {onDelete: "cascade"}),
    addedAt: timestamp("added_at").notNull().defaultNow(),
});

export type ImportJobStatus = "queued" | "processing" | "done" | "failed";

export const job_import_audience = pgTable("job_import_audience", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, {onDelete: "cascade"}),
    status: text("status").notNull().default("queued"), // ImportJobStatus
    fileName: text("file_name").notNull().default("import"),
    totalRows: integer("total_rows").notNull().default(0),
    processedRows: integer("processed_rows").notNull().default(0),
    newCount: integer("new_count").notNull().default(0),
    updatedCount: integer("updated_count").notNull().default(0),
    skippedCount: integer("skipped_count").notNull().default(0),
    // Parsed rows stored as JSONB so worker can process without re-reading the file
    rows: jsonb("rows").notNull().default([]),
    mapping: jsonb("mapping").notNull().default({}),
    mergeStrategy: text("merge_strategy").notNull().default("fill"),
    addToListId: uuid("add_to_list_id"),
    error: text("error"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─────────────────────────────────────────────
// MARKETING CORE (Templates, Campaigns, Sends)
// ─────────────────────────────────────────────

export const marketingProvider = pgTable("marketing_provider", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").references(() => user.id, {onDelete: "cascade"}), // null = system
    channel: text("channel").notNull(),
    name: text("name").notNull(),
    config: jsonb("config").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const marketingTemplate = pgTable("marketing_template", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, {onDelete: "cascade"}),
    channel: text("channel").notNull(),       // MarketingChannel
    name: text("name").notNull(),
    status: text("status").notNull().default(CAMPAIGN_STATUS.DRAFT), // TemplateStatus
    // future: 'html' | 'drag_drop' | 'preset'
    editorType: text("editor_type").notNull().default("html"),
    thumbnailUrl: text("thumbnail_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const emailTemplateDetail = pgTable("email_template_detail", {
    id: uuid("id").defaultRandom().primaryKey(),
    templateId: uuid("template_id")
        .notNull()
        .unique()
        .references(() => marketingTemplate.id, {onDelete: "cascade"}),
    subject: text("subject").notNull(),
    previewText: text("preview_text"),
    htmlBody: text("html_body").notNull(),
    // stored for future drag-drop: JSON component tree
    jsonBody: jsonb("json_body"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// export const smsTemplateDetail = pgTable("sms_template_detail", {
//     id: uuid("id").defaultRandom().primaryKey(),
//     templateId: text("template_id")
//         .notNull()
//         .unique()
//         .references(() => marketingTemplate.id, {onDelete: "cascade"}),
//     messageText: text("message_text").notNull(), // max 160 chars per SMS segment
//     createdAt: timestamp("created_at").notNull().defaultNow(),
//     updatedAt: timestamp("updated_at").notNull().defaultNow(),
// });

// export const pushTemplateDetail = pgTable("push_template_detail", {
//     id: uuid("id").defaultRandom().primaryKey(),
//     templateId: text("template_id")
//         .notNull()
//         .unique()
//         .references(() => marketingTemplate.id, {onDelete: "cascade"}),
//     title: text("title").notNull(),
//     body: text("body").notNull(),
//     imageUrl: text("image_url"),
//     // e.g. { click_action, badge, sound }
//     extraPayload: jsonb("extra_payload").default({}),
//     createdAt: timestamp("created_at").notNull().defaultNow(),
//     updatedAt: timestamp("updated_at").notNull().defaultNow(),
// });

export const marketingCampaign = pgTable("marketing_campaign", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, {onDelete: "cascade"}),
    channel: text("channel").notNull(),         // MarketingChannel
    name: text("name").notNull(),
    status: text("status").notNull().default(CAMPAIGN_STATUS.DRAFT), // CampaignStatus
    templateId: uuid("template_id").references(() => marketingTemplate.id),
    listId: uuid("list_id").references(() => audienceList.id),
    providerId: uuid("provider_id").references(() => marketingProvider.id),
    // Scheduling
    scheduledAt: timestamp("scheduled_at"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    // Aggregate stats (updated by worker as sends complete)
    totalRecipients: integer("total_recipients").notNull().default(0),
    sentCount: integer("sent_count").notNull().default(0),
    deliveredCount: integer("delivered_count").notNull().default(0),
    openedCount: integer("opened_count").notNull().default(0),
    clickedCount: integer("clicked_count").notNull().default(0),
    bouncedCount: integer("bounced_count").notNull().default(0),
    unsubscribedCount: integer("unsubscribed_count").notNull().default(0),
    failedCount: integer("failed_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const emailCampaignDetail = pgTable("email_campaign_detail", {
    id: uuid("id").defaultRandom().primaryKey(),
    campaignId: uuid("campaign_id")
        .notNull()
        .unique()
        .references(() => marketingCampaign.id, {onDelete: "cascade"}),
    fromName: text("from_name").notNull(),
    fromEmail: text("from_email").notNull(),
    replyTo: text("reply_to"),
    // UTM tracking
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// export const smsCampaignDetail = pgTable("sms_campaign_detail", {
//     id: uuid("id").defaultRandom().primaryKey(),
//     campaignId: text("campaign_id")
//         .notNull()
//         .unique()
//         .references(() => marketingCampaign.id, {onDelete: "cascade"}),
//     senderId: text("sender_id").notNull(), // alphanumeric sender id or number
//     createdAt: timestamp("created_at").notNull().defaultNow(),
//     updatedAt: timestamp("updated_at").notNull().defaultNow(),
// });

// ── Push Campaign ──────────────────────────────────────────────────
// export const pushCampaignDetail = pgTable("push_campaign_detail", {
//     id: uuid("id").defaultRandom().primaryKey(),
//     campaignId: text("campaign_id")
//         .notNull()
//         .unique()
//         .references(() => marketingCampaign.id, {onDelete: "cascade"}),
//     topic: text("topic"), // Firebase topic or segment
//     createdAt: timestamp("created_at").notNull().defaultNow(),
//     updatedAt: timestamp("updated_at").notNull().defaultNow(),
// });

// ── Per-recipient send log (all channels) ─────────────────────────────────
export const marketingSendLog = pgTable("marketing_send_log", {
    id: uuid("id").defaultRandom().primaryKey(),
    campaignId: uuid("campaign_id")
        .notNull()
        .references(() => marketingCampaign.id, {onDelete: "cascade"}),
    subscriberId: uuid("subscriber_id")
        .notNull()
        .references(() => audience.id, {onDelete: "cascade"}),
    status: text("status").notNull().default("pending"), // SendStatus
    // Provider message ID for webhook matching
    providerMessageId: text("provider_message_id"),
    // Tracking timestamps
    sentAt: timestamp("sent_at"),
    deliveredAt: timestamp("delivered_at"),
    openedAt: timestamp("opened_at"),
    clickedAt: timestamp("clicked_at"),
    bouncedAt: timestamp("bounced_at"),
    unsubscribedAt: timestamp("unsubscribed_at"),
    // Error info on failure
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    // Open/click tracking pixel / link metadata
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const jobMarketingBlast = pgTable("job_marketing_blast", {
    id: uuid("id").defaultRandom().primaryKey(),
    campaignId: uuid("campaign_id")
        .notNull()
        .references(() => marketingCampaign.id, {onDelete: "cascade"}),
    // BullMQ job ID for correlation
    bullJobId: text("bull_job_id"),
    status: text("status").notNull().default("waiting"), // BlastJobStatus
    channel: text("channel").notNull(),
    // Batch info — large lists are chunked
    batchIndex: integer("batch_index").notNull().default(0),
    batchSize: integer("batch_size").notNull().default(100),
    totalBatches: integer("total_batches").notNull().default(1),
    // Schedule
    scheduledAt: timestamp("scheduled_at"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    // Retry tracking
    attempt: integer("attempt").notNull().default(1),
    maxAttempts: integer("max_attempts").notNull().default(3),
    // Error details on failure
    errorMessage: text("error_message"),
    // Raw BullMQ job data snapshot
    jobData: jsonb("job_data"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─────────────────────────────────────────────
// WALLET TABLES
// ─────────────────────────────────────────────

export const wallets = pgTable("wallets", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
        .references(() => user.id, {onDelete: "cascade"})
        .notNull(),
    // 'email', 'whatsapp', 'sms'
    walletType: text("wallet_type").notNull()
        .default(WALLET_TYPES.MAIN),
    balance: decimal("balance", {precision: 12, scale: 2})
        .default("0.00").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
    // This prevents a user from accidentally having two same wallets
    userTypeIdx: uniqueIndex("user_wallet_type_idx").on(table.userId, table.walletType),
}));

export const walletTransaction = pgTable("wallet_transaction", {
    id: uuid("id").defaultRandom().primaryKey(),
    walletId: uuid("wallet_id") // Link directly to the specific wallet
        .notNull()
        .references(() => wallets.id, {onDelete: "cascade"}),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, {onDelete: "cascade"}),
    amount: decimal("amount", {precision: 12, scale: 2}).notNull(),
    type: text("type").notNull(), // 'credit' | 'debit'
    module: text("module"),

    // Tracking metadata
    referenceId: text("reference_id"),                  // campaignId or other source
    unitCost: decimal("unit_cost", {precision: 10, scale: 6}),
    units: integer("units"),

    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: text("created_by").references(() => user.id),
});
