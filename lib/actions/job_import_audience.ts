"use server";

import {fetchSession} from "@/lib/session";
import {db} from "@/lib/db";
import {job_import_audience} from "@/lib/db/schema";
import {desc, eq} from "drizzle-orm";
import type {ImportField} from "@/lib/audience-utils";
import * as XLSX from "xlsx";
import {randomUUID} from "crypto";
import {getAudienceImportQueue} from "@/lib/queue";
import {revalidatePath} from "next/cache";

export async function parseImportFile(formData: FormData) {
    const file = formData.get("file") as File;
    if (!file)
        throw new Error("No file provided");

    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, {type: "buffer"});
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
        defval: "",
        raw: false,
    });
    if (rows.length === 0)
        throw new Error("File is empty");

    const headers = Object.keys(rows[0]);
    const previewLimit = parseInt(process.env.AUDIENCE_IMPORT_PREVIEW_ROWS ?? "5", 10);

    // Slice the rows based on the environment variable
    const preview = rows
        .slice(0, previewLimit)
        .map((row) => headers.map((h) => row[h]));

    return {
        headers,
        preview,
        totalRows: rows.length
    };
}

export async function queueAudienceImport(formData: FormData) {
    const session = await fetchSession();
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");
    const mapping: Record<string, ImportField> = JSON.parse(formData.get("mapping") as string);
    const mergeStrategy = formData.get("mergeStrategy") as "fill" | "overwrite";
    const addToListId = (formData.get("addToListId") as string) || undefined;

    // Parse the file now (fast) — worker processes rows in background
    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, {type: "buffer"});
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, {defval: "", raw: false});

    if (rows.length === 0) throw new Error("File is empty");

    // Save job record with parsed rows
    const jobId = randomUUID();
    await db.insert(job_import_audience).values({
        id: jobId,
        userId: session.user.id,
        fileName: file.name,
        totalRows: rows.length,
        rows: rows as unknown as Record<string, unknown>[],
        mapping: mapping as unknown as Record<string, unknown>,
        mergeStrategy,
        addToListId: addToListId ?? null,
        updatedAt: new Date(),
    });

    // Enqueue — worker picks this up and processes in background
    await getAudienceImportQueue().add("import", {importJobId: jobId}, {jobId});

    revalidatePath("/audiences");
    return {jobId, totalRows: rows.length};
}

export async function fetchImportJobs() {
    const session = await fetchSession();
    return db
        .select({
            id: job_import_audience.id,
            status: job_import_audience.status,
            fileName: job_import_audience.fileName,
            totalRows: job_import_audience.totalRows,
            processedRows: job_import_audience.processedRows,
            newCount: job_import_audience.newCount,
            updatedCount: job_import_audience.updatedCount,
            skippedCount: job_import_audience.skippedCount,
            error: job_import_audience.error,
            createdAt: job_import_audience.createdAt,
        })
        .from(job_import_audience)
        .where(eq(job_import_audience.userId, session.user.id))
        .orderBy(desc(job_import_audience.createdAt))
        .limit(10);
}
