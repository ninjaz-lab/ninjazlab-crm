import {unstable_noStore as noStore} from "next/cache";
import {PageHeader} from "@/components/page-header";
import {HugeIcon} from "@/components/huge-icon";
import {QueueDashboard} from "./_components/queue-dashboard";
import {fetchQueueJobs, getQueueMetrics} from "@/lib/actions/admin/queue";

export default async function QueuePage() {
    noStore();

    const [metrics, jobs] = await Promise.all([
        getQueueMetrics(),
        fetchQueueJobs()
    ]);

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-2">

            <PageHeader title="Job Queue Mission Control"
                        description="Monitor active campaigns blasts, background tasks, and failures"
                        tag="Admin Only"
                        tagClassName="text-rose-600"
            >
                <div
                    className="h-8 w-8 rounded-md border flex items-center justify-center bg-card shadow-sm text-muted-foreground">
                    <HugeIcon name="Queue02Icon" size={16}/>
                </div>
            </PageHeader>

            <QueueDashboard data={jobs}
                            metrics={metrics as any}/>
        </div>
    );
}