import "dotenv/config";
import {Worker} from "bullmq";
import {and, eq, inArray, or, sql} from "drizzle-orm";
import {randomUUID} from "crypto";
import {db} from "@/lib/db";
import {audience, audience_segment, audienceSegmentMember, job_import_audience, notification} from "@/lib/db/schema";
import {type ContactImportJobData} from "@/lib/queue";
import {type ImportField, sanitizeValue} from "@/lib/audience-utils";

const connection = {url: process.env.REDIS_URL};
const BATCH_SIZE = parseInt(process.env.CONTACT_IMPORT_BATCH_SIZE ?? "500", 10);
const UPDATE_INTERVAL = parseInt(process.env.CONTACT_IMPORT_UPDATE_INTERVAL ?? "200", 10);
const CONCURRENCY = parseInt(process.env.CONTACT_IMPORT_CONCURRENCY ?? "5", 10);

const worker = new Worker<ContactImportJobData>(
    "audience-import",
    async (job) => {
        const {importJobId} = job.data;
        const logPrefix = `[audience-import] [${importJobId}]`;

        console.log(`${logPrefix} ========== STARTING JOB ==========`);

        const [importJob] = await db
            .select()
            .from(job_import_audience)
            .where(eq(job_import_audience.id, importJobId));

        if (!importJob) {
            console.error(`${logPrefix} ERROR: Import job not found in database.`);
            throw new Error(`Import job ${importJobId} not found`);
        }

        await db
            .update(job_import_audience)
            .set({status: "processing", updatedAt: new Date()})
            .where(eq(job_import_audience.id, importJobId));

        const rows = importJob.rows as Record<string, string>[];
        const mapping = importJob.mapping as Record<string, ImportField>;
        const mergeStrategy = importJob.mergeStrategy as "fill" | "overwrite";
        const userId = importJob.userId;

        console.log(`${logPrefix}    - Total Rows: [${rows.length}]`);
        console.log(`${logPrefix}    - Merge Strategy: [${mergeStrategy}]`);
        console.log(`${logPrefix}    - List ID: [${importJob.addToListId || "None"}]`);

        let newCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        const importedIds: string[] = [];

        // ── Step 1: Map all rows, require Email OR Phone ──────────
        console.log(`${logPrefix} ========== Step 1: Mapping rows and identifying Email/Phone keys ==========`);

        type MappedRow = {
            data: Record<string, any>;
            emailKey: string | null;
            phoneKey: string | null
        };

        // Track incoming rows by BOTH keys to catch cross-pollinated duplicates
        const emailToRow = new Map<string, MappedRow>();
        const phoneToRow = new Map<string, MappedRow>();

        const formatName = (name: string) => {
            return name.replace(
                /\w\S*/g,
                (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
            );
        };

        for (const row of rows) {
            const data: Record<string, any> = {};
            for (const [col, field] of Object.entries(mapping)) {
                if (field !== "skip") {
                    const rawVal = row[col];
                    let val = rawVal ? sanitizeValue(rawVal).trim() : "";

                    if (val === "" || val.toLowerCase() === "null")
                        data[field] = null;
                    else {
                        if (field === "firstName" || field === "lastName")
                            val = formatName(val);
                        data[field] = val;
                    }
                }
            }

            const emailKey = data.email ? String(data.email).toLowerCase() : null;
            const phoneKey = data.phone ? String(data.phone) : null;

            // OMNICHANNEL RULE: Drop the row ONLY if they have neither an email nor a phone
            if (!emailKey && phoneKey === null) {
                skippedCount++;
                continue;
            }

            // Check if we have seen THIS person via either their email OR phone
            let existingRow: MappedRow | undefined;
            if (emailKey && emailToRow.has(emailKey))
                existingRow = emailToRow.get(emailKey);
            else if (phoneKey && phoneToRow.has(phoneKey))
                existingRow = phoneToRow.get(phoneKey);

            if (existingRow) {
                // We found a duplicate in the file! Overwrite with the latest row's data
                Object.assign(existingRow.data, data);

                // If this new row has an email/phone the previous one lacked, link it up
                if (emailKey && !existingRow.emailKey) {
                    existingRow.emailKey = emailKey;
                    emailToRow.set(emailKey, existingRow);
                }
                if (phoneKey && !existingRow.phoneKey) {
                    existingRow.phoneKey = phoneKey;
                    phoneToRow.set(phoneKey, existingRow);
                }
            } else {
                // Brand new person in the file
                const newRow: MappedRow = {data, emailKey, phoneKey};
                if (emailKey) emailToRow.set(emailKey, newRow);
                if (phoneKey) phoneToRow.set(phoneKey, newRow);
            }
        }

        // Extract the unique rows. We use a Set because the exact same MappedRow object
        // might exist in BOTH emailToRow and phoneToRow.
        const uniqueMapped = new Set<MappedRow>();
        for (const r of emailToRow.values()) uniqueMapped.add(r);
        for (const r of phoneToRow.values()) uniqueMapped.add(r);

        const mapped: MappedRow[] = Array.from(uniqueMapped);
        console.log(`${logPrefix} ========== ✅ Step 1 Complete - Mapped: [${mapped.length}], Skipped (NO email AND phone): [${skippedCount}] ==========`);

        // ── Step 2: Batch-lookup all existing contacts by Email OR Phone ─────────────
        console.log(`${logPrefix} ========== Step 2: Looking up existing contacts ==========`);
        // We maintain two separate maps for quick lookups in Step 3
        const existingByEmail = new Map<string, typeof audience.$inferSelect>();
        const existingByPhone = new Map<string, typeof audience.$inferSelect>();

        for (let i = 0; i < mapped.length; i += BATCH_SIZE) {
            const chunk = mapped.slice(i, i + BATCH_SIZE);

            // Gather all non-null emails and phones from this chunk
            const emails = chunk.map(r => r.emailKey).filter(Boolean) as string[];
            const phones = chunk.map(r => r.phoneKey).filter(Boolean) as string[];

            const conditions = [];
            if (emails.length > 0) conditions.push(inArray(sql`lower
                ( ${audience.email})`, emails));
            if (phones.length > 0) conditions.push(inArray(audience.phone, phones));

            if (conditions.length > 0) {
                // Query: Find contacts where email matches OR phone matches
                const results = await db
                    .select()
                    .from(audience)
                    .where(
                        and(
                            eq(audience.userId, userId),
                            or(...conditions)
                        )
                    );

                for (const c of results) {
                    if (c.email) existingByEmail.set(c.email.toLowerCase(), c);
                    if (c.phone) existingByPhone.set(c.phone, c);
                }
            }
        }
        console.log(`${logPrefix} ✅ Step 2 Complete - Found existing contacts (Emails: [${existingByEmail.size}], Phones: [${existingByPhone.size})].`);

        // ── Step 3: Split into inserts vs updates ───────────────────────────
        type PendingUpdate = { id: string; patch: Record<string, any> };
        const toInsert: Array<typeof audience.$inferInsert> = [];
        const toUpdate: PendingUpdate[] = [];

        for (const {data, emailKey, phoneKey} of mapped) {
            // Find existing contact (prioritize email match, fallback to phone match)
            let existing = null;
            if (emailKey && existingByEmail.has(emailKey)) {
                existing = existingByEmail.get(emailKey);
            } else if (phoneKey && existingByPhone.has(phoneKey)) {
                existing = existingByPhone.get(phoneKey);
            }

            if (existing) {
                if (mergeStrategy === "fill") {
                    const patch: Record<string, any> = {};
                    for (const [k, v] of Object.entries(data)) {
                        if (!existing[k as keyof typeof existing] && v !== null)
                            patch[k] = v;
                    }
                    if (Object.keys(patch).length > 0) {
                        toUpdate.push({id: existing.id, patch});
                        updatedCount++;
                    } else {
                        skippedCount++;
                    }
                } else {
                    // OVERWRITE STRATEGY
                    const patch: Record<string, any> = {};
                    let hasChanges = false;

                    for (const [k, v] of Object.entries(data)) {
                        if (existing[k as keyof typeof existing] !== v) {
                            patch[k] = v;
                            hasChanges = true;
                        }
                    }

                    if (hasChanges) {
                        toUpdate.push({id: existing.id, patch});
                        updatedCount++;
                    } else {
                        skippedCount++;
                    }
                }
                importedIds.push(existing.id);
            } else {
                // INSERT STRATEGY
                const id = randomUUID();
                toInsert.push({id, userId, source: "import", ...data, updatedAt: new Date()});
                newCount++;
                importedIds.push(id);
            }
        }
        console.log(`${logPrefix} ✅ Step 3 Complete - Prepared ${toInsert.length} inserts and ${toUpdate.length} updates.`);

        // ── Step 4: Batch insert new contacts ───────────────────────────────
        if (toInsert.length > 0) console.log(`${logPrefix} ========== Step 4: Batch inserting [${toInsert.length}] new contacts ==========`);
        for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
            const chunk = toInsert.slice(i, i + BATCH_SIZE);
            await db.insert(audience).values(chunk);

            const processed = i + chunk.length;
            await db
                .update(job_import_audience)
                .set({processedRows: processed, newCount: processed, updatedAt: new Date()})
                .where(eq(job_import_audience.id, importJobId));
            await job.updateProgress(Math.round((processed / rows.length) * 50));
            console.log(`${logPrefix} Step 4 Progress - Inserted ${processed}/${toInsert.length} ✅`);
        }

        // ── Step 5: Apply updates (individual — no lookup overhead) ─────────
        if (toUpdate.length > 0) {
            console.log(`${logPrefix} ========== Step 5: Applying ${toUpdate.length} updates ==========`);

            // We can increase this slightly now that it's in a transaction
            const UPDATE_CHUNK_SIZE = 100;

            for (let i = 0; i < toUpdate.length; i += UPDATE_CHUNK_SIZE) {
                const chunk = toUpdate.slice(i, i + UPDATE_CHUNK_SIZE);

                await db.transaction(async (tx) => {
                    for (const updateData of chunk) {
                        await tx.update(audience)
                            .set({...updateData.patch, updatedAt: new Date()})
                            .where(eq(audience.id, updateData.id));
                    }
                });

                // Progress updating logic
                if (i % UPDATE_INTERVAL < UPDATE_CHUNK_SIZE) {
                    const processed = toInsert.length + i + chunk.length;
                    await db
                        .update(job_import_audience)
                        .set({
                            processedRows: processed,
                            newCount,
                            updatedCount: i + chunk.length,
                            updatedAt: new Date()
                        })
                        .where(eq(job_import_audience.id, importJobId));
                    await job.updateProgress(50 + Math.round(((i + chunk.length) / Math.max(toUpdate.length, 1)) * 50));
                    console.log(`${logPrefix} Step 5 Progress - Updated ${i + chunk.length}/${toUpdate.length} ✅`);
                }
            }
        }

        // ── Step 6: Add to segment if specified ─────────────────────────────
        if (importJob.addToListId && importedIds.length > 0) {
            console.log(`${logPrefix} ========== Step 6: Assigning ${importedIds.length} contacts to list ${importJob.addToListId} ==========`);
            let totalAddedToList = 0;

            for (let i = 0; i < importedIds.length; i += BATCH_SIZE) {
                const chunk = importedIds.slice(i, i + BATCH_SIZE);

                const existingMembers = await db
                    .select({audienceId: audienceSegmentMember.audienceId})
                    .from(audienceSegmentMember)
                    .where(
                        and(
                            eq(audienceSegmentMember.listId, importJob.addToListId),
                            inArray(audienceSegmentMember.audienceId, chunk)
                        )
                    );

                const existingSet = new Set(existingMembers.map((e) => e.audienceId));
                const newMembers = chunk.filter((id) => !existingSet.has(id));

                if (newMembers.length > 0) {
                    await db.insert(audienceSegmentMember).values(
                        newMembers.map((contactId) => ({
                            id: randomUUID(),
                            listId: importJob.addToListId!,
                            audienceId: contactId
                        }))
                    );
                    totalAddedToList += newMembers.length;
                }
            }

            if (totalAddedToList > 0) {
                await db
                    .update(audience_segment)
                    .set({
                        count: sql`${audience_segment.count}
                        +
                        ${totalAddedToList}`,
                        updatedAt: new Date()
                    })
                    .where(eq(audience_segment.id, importJob.addToListId!));
                console.log(`${logPrefix} ✅ Step 6 Complete - Added ${totalAddedToList} new members to the list (skipped existing).`);
            } else {
                console.log(`${logPrefix} ✅ Step 6 Complete - No new members added to the list (all were already members).`);
            }
        }

        // ── Step 7: Mark done ────────────────────────────────────────────────
        console.log(`${logPrefix} Step 7: Finalizing job...`);
        await db
            .update(job_import_audience)
            .set({
                status: "done",
                processedRows: rows.length,
                newCount,
                updatedCount,
                skippedCount,
                updatedAt: new Date()
            })
            .where(eq(job_import_audience.id, importJobId));

        // ── Step 7: Notify client done ────────────────────────────────────────────────
        await db.insert(notification).values({
            id: randomUUID(),
            userId: userId,
            type: "import_success",
            title: "Import Completed",
            message: `Successfully processed ${importJob.fileName}. ${newCount} new, ${updatedCount} updated, ${skippedCount} skipped.`,
            actionUrl: "/audience",
        });

        console.log(`${logPrefix} ✅ FINISHED — new: [${newCount}], updated: [${updatedCount}], skipped: [${skippedCount}]`);
    },
    {connection, concurrency: CONCURRENCY}
);

worker.on("failed", async (job, err) => {
    if (!job)
        return;

    const logPrefix = `[audience-import] [${job.data.importJobId}]`;
    console.error(`${logPrefix} FAILED:`, err.message);
    console.error(err.stack);

    // 1. Mark job as failed in DB
    await db
        .update(job_import_audience)
        .set({status: "failed", error: err.message, updatedAt: new Date()})
        .where(eq(job_import_audience.id, job.data.importJobId));

    // 2. Fetch the job details to know who to notify
    const [failedJob] = await db
        .select({userId: job_import_audience.userId, fileName: job_import_audience.fileName})
        .from(job_import_audience)
        .where(eq(job_import_audience.id, job.data.importJobId));

    // 3. Trigger global failure notification
    if (failedJob) {
        await db.insert(notification).values({
            id: randomUUID(),
            userId: failedJob.userId,
            type: "import_failed",
            title: "Import Failed",
            message: `We encountered an error processing ${failedJob.fileName}: ${err.message}`,
            actionUrl: "/audience",
        });
    }
});

console.log("[audience-import] Worker initialized and waiting for jobs...");