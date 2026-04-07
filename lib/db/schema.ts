import {
  pgTable,
  text,
  timestamp,
  boolean,
  decimal,
  integer,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────
// AUTH TABLES
// ─────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  role: text("role").default("user"),
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
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
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
// CRM MODULE PERMISSIONS & BILLING
// ─────────────────────────────────────────────

export const MODULES = [
  "email_marketing",
  "sms_marketing",
  "push_marketing",
  "billing",
  "reports",
  "crm",
  "inventory",
  "analytics",
  "support",
] as const;
export type Module = (typeof MODULES)[number];

export const userPermission = pgTable("user_permission", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  module: text("module").notNull(),
  enabled: boolean("enabled").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userAccount = pgTable("user_account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("0.00"),
  currency: text("currency").notNull().default("USD"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const accountTransaction = pgTable("account_transaction", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  type: text("type").notNull(), // 'credit' | 'debit'
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: text("created_by").references(() => user.id),
});

// ─────────────────────────────────────────────
// MARKETING — SHARED CORE TABLES (Option C)
// ─────────────────────────────────────────────
//
// Channel values: 'email' | 'sms' | 'push'
// All orchestration (scheduling, jobs, logs) is unified.
// Channel-specific payload lives in *_detail tables.
// ─────────────────────────────────────────────

// Enums stored as text with type-safe TS types
export type MarketingChannel = "email" | "sms" | "push";
export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "sent"
  | "paused"
  | "cancelled";
export type TemplateStatus = "draft" | "published";
export type SendStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "unsubscribed"
  | "failed";
export type BlastJobStatus =
  | "waiting"
  | "active"
  | "completed"
  | "failed"
  | "delayed"
  | "paused";
export type SubscriberStatus = "subscribed" | "unsubscribed" | "bounced" | "complained";

// ── System-wide sending provider (admin-managed only) ─────────────────────
// userId = null → system-level provider configured by admin, used by all campaigns.
// email: { type:'ses', region, accessKeyId, secretAccessKey }
//       | { type:'smtp', host, port, user, pass }
//       | { type:'resend', apiKey }
// sms:  { type:'twilio', accountSid, authToken, fromNumber }
// push: { type:'firebase', serviceAccountJson }
export const marketingProvider = pgTable("marketing_provider", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }), // null = system
  channel: text("channel").notNull(),
  name: text("name").notNull(),
  config: jsonb("config").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Subscriber list (shared across channels) ──────────────────────────────
export const marketingList = pgTable("marketing_list", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  channel: text("channel").notNull(), // which channel this list is for
  subscriberCount: integer("subscriber_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Individual subscriber ─────────────────────────────────────────────────
// email -> email field used
// sms   -> phone field used
// push  -> deviceToken field used
export const marketingSubscriber = pgTable("marketing_subscriber", {
  id: text("id").primaryKey(),
  userId: text("user_id") // owning CRM user
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  channel: text("channel").notNull(),
  email: text("email"),
  phone: text("phone"),
  deviceToken: text("device_token"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  // Arbitrary custom fields e.g. { company, plan, city }
  attributes: jsonb("attributes").default({}),
  status: text("status").notNull().default("subscribed"), // SubscriberStatus
  unsubscribedAt: timestamp("unsubscribed_at"),
  bouncedAt: timestamp("bounced_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── List ↔ Subscriber join ────────────────────────────────────────────────
export const marketingListSubscriber = pgTable("marketing_list_subscriber", {
  id: text("id").primaryKey(),
  listId: text("list_id")
    .notNull()
    .references(() => marketingList.id, { onDelete: "cascade" }),
  subscriberId: text("subscriber_id")
    .notNull()
    .references(() => marketingSubscriber.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Template (shared core) ────────────────────────────────────────────────
export const marketingTemplate = pgTable("marketing_template", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  channel: text("channel").notNull(),       // MarketingChannel
  name: text("name").notNull(),
  status: text("status").notNull().default("draft"), // TemplateStatus
  // future: 'html' | 'drag_drop' | 'preset'
  editorType: text("editor_type").notNull().default("html"),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Email template detail ─────────────────────────────────────────────────
export const emailTemplateDetail = pgTable("email_template_detail", {
  id: text("id").primaryKey(),
  templateId: text("template_id")
    .notNull()
    .unique()
    .references(() => marketingTemplate.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  previewText: text("preview_text"),
  htmlBody: text("html_body").notNull(),
  // stored for future drag-drop: JSON component tree
  jsonBody: jsonb("json_body"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── SMS template detail ───────────────────────────────────────────────────
export const smsTemplateDetail = pgTable("sms_template_detail", {
  id: text("id").primaryKey(),
  templateId: text("template_id")
    .notNull()
    .unique()
    .references(() => marketingTemplate.id, { onDelete: "cascade" }),
  messageText: text("message_text").notNull(), // max 160 chars per SMS segment
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Push notification template detail ────────────────────────────────────
export const pushTemplateDetail = pgTable("push_template_detail", {
  id: text("id").primaryKey(),
  templateId: text("template_id")
    .notNull()
    .unique()
    .references(() => marketingTemplate.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  imageUrl: text("image_url"),
  // e.g. { click_action, badge, sound }
  extraPayload: jsonb("extra_payload").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Campaign (shared core) ────────────────────────────────────────────────
export const marketingCampaign = pgTable("marketing_campaign", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  channel: text("channel").notNull(),         // MarketingChannel
  name: text("name").notNull(),
  status: text("status").notNull().default("draft"), // CampaignStatus
  templateId: text("template_id").references(() => marketingTemplate.id),
  listId: text("list_id").references(() => marketingList.id),
  providerId: text("provider_id").references(() => marketingProvider.id),
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

// ── Email campaign detail ─────────────────────────────────────────────────
export const emailCampaignDetail = pgTable("email_campaign_detail", {
  id: text("id").primaryKey(),
  campaignId: text("campaign_id")
    .notNull()
    .unique()
    .references(() => marketingCampaign.id, { onDelete: "cascade" }),
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

// ── SMS campaign detail ───────────────────────────────────────────────────
export const smsCampaignDetail = pgTable("sms_campaign_detail", {
  id: text("id").primaryKey(),
  campaignId: text("campaign_id")
    .notNull()
    .unique()
    .references(() => marketingCampaign.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull(), // alphanumeric sender id or number
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Push campaign detail ──────────────────────────────────────────────────
export const pushCampaignDetail = pgTable("push_campaign_detail", {
  id: text("id").primaryKey(),
  campaignId: text("campaign_id")
    .notNull()
    .unique()
    .references(() => marketingCampaign.id, { onDelete: "cascade" }),
  topic: text("topic"), // Firebase topic or segment
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Per-recipient send log (all channels) ─────────────────────────────────
export const marketingSendLog = pgTable("marketing_send_log", {
  id: text("id").primaryKey(),
  campaignId: text("campaign_id")
    .notNull()
    .references(() => marketingCampaign.id, { onDelete: "cascade" }),
  subscriberId: text("subscriber_id")
    .notNull()
    .references(() => marketingSubscriber.id, { onDelete: "cascade" }),
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

// ── BullMQ blast job record ───────────────────────────────────────────────
// One row per job dispatched. Retries create a new row (attempt > 1).
export const marketingBlastJob = pgTable("marketing_blast_job", {
  id: text("id").primaryKey(),
  campaignId: text("campaign_id")
    .notNull()
    .references(() => marketingCampaign.id, { onDelete: "cascade" }),
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
