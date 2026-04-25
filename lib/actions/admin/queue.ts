import {authenticateAdmin} from "@/lib/actions/session";
import {getEmailBlastQueue} from "@/lib/queue";

export async function getQueueMetrics() {
    await authenticateAdmin();
    const queue = getEmailBlastQueue();

    // Get counts for the metrics cards
    return await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
}

export async function fetchQueueJobs(start = 0, end = 100) {
    await authenticateAdmin();
    const queue = getEmailBlastQueue();

    // Fetch jobs across relevant statuses (limit to 100 to prevent crashing the UI if there are millions)
    const jobs = await queue.getJobs(['waiting', 'active', 'delayed', 'failed'], start, end);

    // Serialize the jobs for the client component
    return Promise.all(jobs.map(async (job) => {
        const state = await job.getState();
        return {
            id: job.id || "unknown",
            name: job.name,
            campaignId: job.data?.campaignId || "N/A",
            status: state,
            attemptsMade: job.attemptsMade,
            failedReason: job.failedReason || null,
            timestamp: job.timestamp,
        };
    }));
}

// Optional: Add a function to clear failed jobs or retry them later!
export async function cleanFailedJobs() {
    await authenticateAdmin();
    const queue = getEmailBlastQueue();
    await queue.clean(0, 1000, 'failed');
}