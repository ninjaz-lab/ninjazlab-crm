"use server";

import {db} from "@/lib/db";
import {wallets, walletTransaction} from "@/lib/db/schema";
import {and, desc, eq, gte, sum} from "drizzle-orm";
import {TRANSACTION_MODULES, TRANSACTION_STATUS, TRANSACTION_TYPES, WALLET_TYPES} from "@/lib/enums";
import {authenticateUser} from "@/lib/actions/session";
import {revalidatePath} from "next/cache";
import {randomUUID} from "crypto";
import {PutObjectCommand} from "@aws-sdk/client-s3";
import {notifyAdmins} from "@/lib/actions/notification";
import {fetchR2Client} from "@/lib/actions/cloudflare-rs";

export async function fetchUserWalletData() {
    // 1. Authenticate the user
    const session = await authenticateUser();
    const userId = session.user.id;

    // 2. Fetch Balance
    const [wallet] = await db
        .select({balance: wallets.balance})
        .from(wallets)
        .where(
            and(
                eq(wallets.userId, userId),
                eq(wallets.walletType, WALLET_TYPES.MAIN)
            )
        )
        .limit(1);

    // 3. Fetch Transaction History
    const transactions = await db
        .select()
        .from(walletTransaction)
        .where(eq(walletTransaction.userId, userId))
        .orderBy(desc(walletTransaction.createdAt));

    // 3. Calculate Monthly Spend
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [monthlyDebits] = await db
        .select({totalAmount: sum(walletTransaction.amount)})
        .from(walletTransaction)
        .where(
            and(
                eq(walletTransaction.userId, userId),
                eq(walletTransaction.type, TRANSACTION_TYPES.DEBIT),
                gte(walletTransaction.createdAt, startOfMonth)
            )
        );

    // 4. Get the absolute current balance from the wallet table
    let runningBalance = parseFloat(wallet?.balance?.toString() || "0");

    // 5. Map through transactions (ordered desc by Date)
    const mappedTransactions = transactions.map((t) => {
        const amount = parseFloat(t.amount.toString());
        const isCredit = t.type.toLowerCase() === TRANSACTION_TYPES.CREDIT.toLowerCase();
        const isCompleted = t.status === TRANSACTION_STATUS.COMPLETED;

        // Snapshot the balance for THIS row
        const currentRunningBalance = runningBalance;

        // If the transaction is completed, we reverse-engineer the math to find out what the balance was BEFORE this transaction happened
        if (isCompleted) {
            if (isCredit)
                runningBalance -= amount; // Revert a top-up
            else
                runningBalance += amount; // Revert a deduction
        }

        return {
            id: t.id,
            date: new Date(t.createdAt).toISOString(),
            description: t.note || "Wallet Transaction",
            amount: amount,
            type: t.type.toLowerCase(),
            status: t.status,
            receiptUrl: t.receiptUrl,
            invoiceUrl: t.invoiceUrl,
            invoiceNumber: t.invoiceNumber,
            balanceAfter: currentRunningBalance
        };
    });

    return {
        balance: parseFloat(wallet?.balance?.toString() || "0"),
        totalSpentThisMonth: Math.abs(parseFloat(monthlyDebits?.totalAmount?.toString() || "0")),
        transactions: mappedTransactions
    };
}

export async function requestTopUp(formData: FormData) {
    const session = await authenticateUser()
    const userId = session.user.id;

    const amountStr = formData.get("amount") as string;
    const amount = parseFloat(amountStr);
    const receiptFile = formData.get("receipt") as File;

    if (isNaN(amount) || amount < 10)
        throw new Error("Minimum amount is MYR 10");
    if (!receiptFile || receiptFile.size === 0)
        throw new Error("A bank receipt is required.");

    const maxMb = parseInt(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB || "5", 10);
    const MAX_FILE_SIZE_BYTES = maxMb * 1024 * 1024;
    if (receiptFile.size > MAX_FILE_SIZE_BYTES)
        throw new Error(`Receipt file size exceeds the ${maxMb}MB limit.`);

    // 1. Get or create wallet (just to ensure they have an account)
    let [wallet] = await db
        .select()
        .from(wallets)
        .where(and(eq(wallets.userId, userId), eq(wallets.walletType, WALLET_TYPES.MAIN)))
        .limit(1);

    if (!wallet)
        [wallet] = await db.insert(wallets).values({
            userId,
            walletType: WALLET_TYPES.MAIN,
            balance: "0",
        }).returning();

    const bytes = await receiptFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a safe, unique filename (saving in a 'receipts' folder)
    const safeFilename = receiptFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const uniqueName = `reload-receipts/${userId}/${randomUUID()}-${safeFilename}`;

    // Upload to Cloudflare R2
    const r2 = fetchR2Client();
    await r2.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: uniqueName,
        Body: buffer,
        ContentType: receiptFile.type,
    }));

    // Construct the public URL
    const receiptUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${uniqueName}`;

    // 3. Create a PENDING Transaction Record
    await db.insert(walletTransaction).values({
        id: randomUUID(),
        walletId: wallet.id,
        userId,
        amount: amount.toFixed(2),
        type: TRANSACTION_TYPES.CREDIT,
        module: TRANSACTION_MODULES.SYSTEM,
        status: TRANSACTION_STATUS.PENDING,
        receiptUrl: receiptUrl,
        note: `Top-up Request`,
        createdAt: new Date(),
    });

    await notifyAdmins(
        "billing_alert",
        "New Top-Up Request",
        `A user has requested a top-up of MYR ${amount.toFixed(2)}.`,
        "/admin/billing"
    );

    revalidatePath("/billing");
    return {success: true};
}
