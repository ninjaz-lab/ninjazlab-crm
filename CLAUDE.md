# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Approach

- Think before acting. Read existing files before writing code.
- Be concise in output but thorough in reasoning.
- Prefer editing over rewriting whole files.
- Do not re-read files you have already read unless the file may have changed.
- Test your code before declaring done.
- No sycophantic openers or closing fluff.
- Keep solutions simple and direct.
- User instructions always override this file.

## Commands

```bash
pnpm dev              # Next.js dev server (Turbopack)
pnpm build            # Production build
pnpm lint             # ESLint
pnpm typecheck        # tsc --noEmit
pnpm format           # Prettier (all .ts/.tsx)

pnpm db:generate      # Generate Drizzle migrations
pnpm db:push          # Push schema directly (dev)
pnpm db:studio        # Drizzle Studio GUI
pnpm db:seed          # Seed database

pnpm worker:import-audience   # BullMQ worker for CSV/Excel audience imports
pnpm worker:email-blasting    # BullMQ worker for email blast sends
```

Workers run as separate long-lived Node processes (not part of Next.js). They require `REDIS_URL` and `DATABASE_URL` in `.env.local`.

## Architecture

### Route Groups

```
app/
  (auth)/           # Login, signup, verification pages
  (user)/           # Authenticated user-facing app
    audience/       # Contact list management + segment builder
    email/
      campaigns/    # Email campaign CRUD + send flow
      templates/    # Drag-drop / HTML email editor (react-email-editor)
    billing/        # Wallet top-up and transaction history
    settings/       # Marketing provider config (SES, etc.)
  (admin)/admin/    # Admin panel (superadmin/admin only)
    users/          # User management + module permissions
    pricing/        # Per-user pricing rule overrides
    providers/      # System-level marketing provider management
    billing/        # All-user transaction ledger
    queue/          # BullMQ job monitoring
  api/
    auth/[...all]/  # better-auth catch-all handler
    webhooks/ses/   # SES delivery event webhooks
```

### Auth

`better-auth` with a Drizzle adapter. Three roles: `user`, `admin`, `superadmin` (see `lib/enums.ts`). Session is fetched server-side via `lib/session.ts#fetchSession()`. Client-side via `lib/auth-client.ts`.

### Database

Single `lib/db/schema.ts` — all tables defined there. Key tables:
- `audience` — CRM contacts with `emailStatus`/`phoneStatus` channel flags
- `audienceList` — static or dynamic (rule-based) segments; `rules` field is `{matchType, rules[]}` JSONB
- `audienceListMember` — many-to-many join
- `job_import_audience` — tracks CSV/Excel import jobs (rows stored as JSONB for worker processing)
- `marketingTemplate` / `emailTemplateDetail` — email templates
- `marketingCampaign` / `emailCampaignDetail` — campaigns; `listId` targets an `audienceList`
- `marketingSendLog` — per-recipient send events (delivery, open, click tracking)
- `jobMarketingBlast` — BullMQ blast job tracking (batched sends)
- `marketingProvider` — per-user or system-level provider config (SES credentials etc.)
- `module` + `userPermission` — feature gating per user
- `wallets` + wallet transaction tables — per-send billing deducted by workers

### Queue (BullMQ + Redis)

Queue singletons are in `lib/queue/index.ts`. Workers are standalone scripts:
- `import-audience-worker.ts` — processes CSV/XLSX rows, upserts `audience` records
- `email-worker.ts` — sends emails in batches, updates `marketingSendLog`, charges wallet via `lib/pricing.ts`

### State Management

Zustand stores in `lib/store/`:
- `app-store.ts` — global app state
- `email-campaign-store.ts` — multi-step campaign creation wizard state
- `segment-store.ts` — segment builder UI state
- `modules-store.ts` — nav module list

### Server Actions

All mutations go through `lib/actions/` (Next.js Server Actions with `"use server"`). Files are domain-split: `audience.ts`, `email-marketing.ts`, `billing.ts`, etc.

### Dynamic Segments

`lib/segments.ts#buildDynamicSegmentQuery()` converts the `{matchType, rules[]}` JSONB stored in `audienceList.rules` into a Drizzle `SQL` WHERE clause. Used at send-time to resolve recipients.

### UI Stack

shadcn/ui (components.json configured) + Tailwind CSS v4 + HugeIcons. Data tables use `@tanstack/react-table`. Forms use `react-hook-form` + `zod`.
