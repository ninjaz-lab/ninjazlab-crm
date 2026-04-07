"use server";

import { db } from "@/lib/db";
import {
  user,
  userAccount,
  userPermission,
  accountTransaction,
  marketingProvider,
  MODULES,
  type Module,
} from "@/lib/db/schema";
import { eq, and, sql, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function getAllUsers() {
  await requireAdmin();
  return db.select().from(user).orderBy(user.createdAt);
}

export async function setUserRole(userId: string, role: "user" | "admin") {
  await requireAdmin();
  await db
    .update(user)
    .set({ role, updatedAt: new Date() })
    .where(eq(user.id, userId));
  revalidatePath("/admin/users");
}

export async function banUser(userId: string, reason: string) {
  await requireAdmin();
  await db
    .update(user)
    .set({ banned: true, banReason: reason, updatedAt: new Date() })
    .where(eq(user.id, userId));
  revalidatePath("/admin/users");
}

export async function unbanUser(userId: string) {
  await requireAdmin();
  await db
    .update(user)
    .set({ banned: false, banReason: null, updatedAt: new Date() })
    .where(eq(user.id, userId));
  revalidatePath("/admin/users");
}

// ── Accounts ───────────────────────────────────────────────────────────────

export async function getAllAccounts() {
  await requireAdmin();
  return db
    .select({
      id: userAccount.id,
      userId: userAccount.userId,
      balance: userAccount.balance,
      currency: userAccount.currency,
      updatedAt: userAccount.updatedAt,
      name: user.name,
      email: user.email,
      image: user.image,
    })
    .from(userAccount)
    .innerJoin(user, eq(userAccount.userId, user.id));
}

export async function ensureAccount(userId: string) {
  const existing = await db
    .select()
    .from(userAccount)
    .where(eq(userAccount.userId, userId))
    .limit(1);
  if (existing.length === 0) {
    await db.insert(userAccount).values({
      id: randomUUID(),
      userId,
      balance: "0.00",
      currency: "USD",
      updatedAt: new Date(),
    });
  }
}

export async function adjustBalance(
  userId: string,
  amount: number,
  type: "credit" | "debit",
  note: string
) {
  const adminSession = await requireAdmin();
  await ensureAccount(userId);

  const delta = type === "credit" ? amount : -amount;

  await db
    .update(userAccount)
    .set({
      balance: sql`${userAccount.balance} + ${delta}`,
      updatedAt: new Date(),
    })
    .where(eq(userAccount.userId, userId));

  await db.insert(accountTransaction).values({
    id: randomUUID(),
    userId,
    amount: Math.abs(amount).toFixed(2),
    type,
    note,
    createdAt: new Date(),
    createdBy: adminSession.user.id,
  });

  revalidatePath("/admin/accounts");
}

export async function getTransactions(userId: string) {
  await requireAdmin();
  return db
    .select()
    .from(accountTransaction)
    .where(eq(accountTransaction.userId, userId))
    .orderBy(accountTransaction.createdAt);
}

// ── Permissions ────────────────────────────────────────────────────────────

export async function getUserPermissions(userId: string) {
  await requireAdmin();
  const rows = await db
    .select()
    .from(userPermission)
    .where(eq(userPermission.userId, userId));

  const map: Record<string, boolean> = {};
  for (const m of MODULES) map[m] = false;
  for (const row of rows) map[row.module] = row.enabled;
  return map;
}

export async function setModulePermission(
  userId: string,
  module: Module,
  enabled: boolean
) {
  await requireAdmin();

  const existing = await db
    .select()
    .from(userPermission)
    .where(
      and(eq(userPermission.userId, userId), eq(userPermission.module, module))
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(userPermission).values({
      id: randomUUID(),
      userId,
      module,
      enabled,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } else {
    await db
      .update(userPermission)
      .set({ enabled, updatedAt: new Date() })
      .where(
        and(
          eq(userPermission.userId, userId),
          eq(userPermission.module, module)
        )
      );
  }

  revalidatePath("/admin/modules");
}

export async function getAllUsersWithPermissions() {
  await requireAdmin();
  const users = await db.select().from(user).where(eq(user.role, "user"));
  const permissions = await db.select().from(userPermission);

  return users.map((u) => {
    const perms: Record<string, boolean> = {};
    for (const m of MODULES) perms[m] = false;
    for (const p of permissions.filter((p) => p.userId === u.id)) {
      perms[p.module] = p.enabled;
    }
    return { ...u, permissions: perms };
  });
}

// ── System Marketing Providers (admin-only) ────────────────────────────────

export async function getSystemProviders(channel?: string) {
  await requireAdmin();
  const conditions = [isNull(marketingProvider.userId)];
  if (channel) conditions.push(eq(marketingProvider.channel, channel));
  return db
    .select()
    .from(marketingProvider)
    .where(and(...conditions))
    .orderBy(marketingProvider.createdAt);
}

export async function createSystemProvider(data: {
  channel: string;
  name: string;
  type: "ses" | "smtp" | "resend";
  config: Record<string, string>;
  isDefault?: boolean;
}) {
  await requireAdmin();
  const { randomUUID } = await import("crypto");

  // If setting as default, unset existing defaults for this channel
  if (data.isDefault) {
    await db
      .update(marketingProvider)
      .set({ isDefault: false })
      .where(
        and(isNull(marketingProvider.userId), eq(marketingProvider.channel, data.channel))
      );
  }

  const id = randomUUID();
  await db.insert(marketingProvider).values({
    id,
    userId: null,
    channel: data.channel,
    name: data.name,
    config: { type: data.type, ...data.config },
    isDefault: data.isDefault ?? false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath("/admin/settings");
  return id;
}

export async function deleteSystemProvider(id: string) {
  await requireAdmin();
  await db
    .delete(marketingProvider)
    .where(and(eq(marketingProvider.id, id), isNull(marketingProvider.userId)));
  revalidatePath("/admin/settings");
}

export async function setDefaultProvider(id: string, channel: string) {
  await requireAdmin();
  await db
    .update(marketingProvider)
    .set({ isDefault: false })
    .where(
      and(isNull(marketingProvider.userId), eq(marketingProvider.channel, channel))
    );
  await db
    .update(marketingProvider)
    .set({ isDefault: true, updatedAt: new Date() })
    .where(eq(marketingProvider.id, id));
  revalidatePath("/admin/settings");
}
