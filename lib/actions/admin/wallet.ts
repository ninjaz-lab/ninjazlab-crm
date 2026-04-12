"use server";

import {db} from "@/lib/db";
import {wallets, walletTransaction} from "@/lib/db/schema";
import {and, desc, eq, sql} from "drizzle-orm";
import {TRANSACTION_MODULES, TRANSACTION_TYPES, WALLET_TYPES} from "@/lib/enums";
import {randomUUID} from "crypto";
import {revalidatePath} from "next/cache";
import {authenticateAdmin} from "@/lib/actions/session";

async function ensureMainWallet(userId: string) {
    const [existing] = await db
        .select()
        .from(wallets)
        .where(and(eq(wallets.userId, userId), eq(wallets.walletType, WALLET_TYPES.MAIN)))
        .limit(1);

    if (existing)
        return existing;

    // If not found, create and return the new billing
    const [newWallet] = await db.insert(wallets).values({
        userId,
        walletType: WALLET_TYPES.MAIN,
        balance: "0",
    }).returning();

    return newWallet;
}

export async function adjustWalletBalance(
    userId: string,
    amount: number,
    type: keyof typeof TRANSACTION_TYPES,
    note: string
) {
    // Validate is Admin
    await authenticateAdmin();

    // 1. Ensure the billing exists and get the record
    const wallet = await ensureMainWallet(userId);

    const delta = type == 'CREDIT'
        ? amount
        : -amount;

    await db.transaction(async (tx) => {
        // 2. Update the billing balance
        await tx.update(wallets)
            .set({
                balance: sql<any>`${wallets.balance}
                +
                ${delta}`,
                updatedAt: new Date()
            })
            .where(eq(wallets.id, wallet.id));

        // 3. Record the transaction tied to that specific billing
        await tx.insert(walletTransaction).values({
            id: randomUUID(),
            walletId: wallet.id,
            userId,
            amount: Math.abs(amount).toFixed(2),
            type: TRANSACTION_TYPES[type],
            module: TRANSACTION_MODULES.SYSTEM,
            note: note || `Admin adjustment`,
            createdAt: new Date(),
        });
    });

    revalidatePath("/admin/accounts");
}

export async function fetchWalletTransactions(
    userId: string,
    page: number = 1,
    pageSize: number = 10
) {
    // Validate is Admin
    await authenticateAdmin();

    const offset = (page - 1) * pageSize;

    const [transactions, countResult] = await Promise.all([
        db.select().from(walletTransaction)
            .where(eq(walletTransaction.userId, userId))
            .limit(pageSize).offset(offset).orderBy(desc(walletTransaction.createdAt)),
        db.select({count: sql<number>`count(*)`}).from(walletTransaction)
            .where(eq(walletTransaction.userId, userId))
    ]);

    return {
        transactions,
        total: Number(countResult[0].count)
    };
}
