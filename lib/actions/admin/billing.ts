"use server";

import {db} from "@/lib/db";
import {user, wallets, walletTransaction} from "@/lib/db/schema";
import {desc, eq, sql} from "drizzle-orm";
import {TRANSACTION_STATUS} from "@/lib/enums";
import {authenticateAdmin} from "@/lib/actions/session";
import {revalidatePath} from "next/cache";
import {notifyUser} from "@/lib/actions/notification";
import {fetchR2Client} from "@/lib/actions/cloudflare-rs";
import {PutObjectCommand} from "@aws-sdk/client-s3";
import {format} from "date-fns";
import {generateInvoicePDF} from "@/lib/utils/invoice";
import {Routes} from "@/lib/constants/routes";


export async function fetchAllTransactions() {
    await authenticateAdmin();

    // Fetch all transactions and join with the user table so we know who it belongs to
    return db
        .select({
            id: walletTransaction.id,
            transactionId: walletTransaction.transactionId,
            date: walletTransaction.createdAt,
            description: walletTransaction.note,
            amount: walletTransaction.amount,
            type: walletTransaction.type,
            status: walletTransaction.status,
            receiptUrl: walletTransaction.receiptUrl,
            userName: user.name,
            userEmail: user.email,
            userImage: user.image,
            userRole: user.role,
        })
        .from(walletTransaction)
        .leftJoin(user, eq(walletTransaction.userId, user.id))
        .orderBy(desc(walletTransaction.createdAt));
}

export async function approveTopUp(transactionId: string) {
    await authenticateAdmin();

    await db.transaction(async (tx) => {
        // 1. Fetch Transaction WITH User Details
        const [data] = await tx
            .select({tx: walletTransaction, user: user})
            .from(walletTransaction)
            .innerJoin(user, eq(walletTransaction.userId, user.id))
            .where(eq(walletTransaction.id, transactionId))
            .limit(1);

        if (!data)
            throw new Error("Transaction not found");

        // 2. Generate Invoice Number & PDF Buffer
        const invoiceNum = `INV-${format(new Date(), "yyyyMMdd")}-${data.tx.id.substring(0, 6).toUpperCase()}`;
        const pdfBuffer = await generateInvoicePDF({
            invoiceNumber: invoiceNum,
            date: new Date(),
            amount: data.tx.amount,
            userName: data.user.name,
            userEmail: data.user.email,
        });

        if (data.tx.status !== TRANSACTION_STATUS.PENDING)
            throw new Error(`Transaction is already ${data.tx.status}`);

        // 3. Upload Invoice to R2
        const r2 = fetchR2Client();
        const uniqueName = `invoices/${data.tx.userId}/${invoiceNum}.pdf`;
        await r2.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: uniqueName,
            Body: pdfBuffer,
            ContentType: "application/pdf",
        }));
        const invoiceUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${uniqueName}`;

        // 4. Update Transaction with APPROVED status and INVOICE data
        await tx.update(walletTransaction)
            .set({
                status: TRANSACTION_STATUS.APPROVED,
                invoiceNumber: invoiceNum,
                invoiceUrl: invoiceUrl
            })
            .where(eq(walletTransaction.id, transactionId));

        // 5. Update Balance & Notify
        await tx.update(wallets).set({
            balance: sql`${wallets.balance} +
            ${data.tx.amount}`,
            updatedAt: new Date()
        }).where(eq(wallets.id, data.tx.walletId));

        await notifyUser(
            data.tx.userId,
            "billing_success",
            "Top-Up Approved ✅",
            `Your top-up of MYR ${data.tx.amount} has been approved.`,
            Routes.USER_BILLING
        );
    });

    revalidatePath(Routes.ADMIN_BILLING);
    revalidatePath(Routes.USER_BILLING);
    return {
        success: true
    };

}

export async function rejectTopUp(transactionId: string) {
    await authenticateAdmin();

    const [transaction] = await db.update(walletTransaction)
        .set({status: TRANSACTION_STATUS.REJECTED})
        .where(eq(walletTransaction.id, transactionId))
        .returning();

    if (transaction) {
        await notifyUser(
            transaction.userId,
            "billing_failed",
            "Top-Up Rejected ❌",
            `Your top-up of MYR ${transaction.amount} was rejected. Please contact support if you believe this is an error.`,
            Routes.USER_BILLING
        );
    }

    revalidatePath(Routes.ADMIN_BILLING);
    return {success: true};
}
