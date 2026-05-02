import {unstable_noStore as noStore} from "next/cache";
import {AudienceTable} from "./_components/audience-table";
import {SegmentsPanel} from "./_components/segments-panel";
import {HugeIcon} from "@/components/huge-icon";
import {MetricCard} from "@/components/metric-card";
import {PageHeader} from "@/components/page-header";
import {fetchAudienceLists, fetchAudiences, fetchUnsubscribedCounts} from "@/lib/actions/audience";
import {fetchImportJobs} from "@/lib/actions/job_import_audience";
import {ImportListener} from "@/app/(user)/audience/_components/import-listener";
import {fetchSession} from "@/lib/session";
import {IMPORT_JOB_STATUS, PAGINATION} from "@/lib/enums";

interface Props {
    searchParams: Promise<{
        search?: string;
        segmentId?: string;
        page?: string;
        pageSize?: string
    }>;
}

export default async function AudiencePage({searchParams}: Props) {
    noStore();

    const session = await fetchSession();

    const sp = await searchParams;
    const search = sp.search ?? "";
    const segmentId = sp.segmentId ?? "";
    const page = Math.max(1, parseInt(sp.page ?? "1", 10));
    const requestedPageSize = sp.pageSize ? parseInt(sp.pageSize, 10) : PAGINATION.DEFAULT_PAGE_SIZE;
    const pageSize = Math.min(requestedPageSize, PAGINATION.MAX_PAGE_SIZE);

    // Calculate Audience Metrics
    const [
        {audiences, total},
        {total: totalAudience},
        segments,
        importJobs,
        unsubscribedCounts
    ] = await Promise.all([
        fetchAudiences({search, listId: segmentId || undefined, page, pageSize}),
        fetchAudiences({page: 1, pageSize: 1}),
        fetchAudienceLists(),
        fetchImportJobs(),
        fetchUnsubscribedCounts(),
    ]);
    const activeImports = importJobs.filter(job => job.status === IMPORT_JOB_STATUS.QUEUED || job.status === IMPORT_JOB_STATUS.PROCESSING).length;
    const completedImports = importJobs.filter(job => job.status === IMPORT_JOB_STATUS.DONE).length;

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-2">

            <ImportListener userId={session.user.id}/>

            <PageHeader title="Audience"
                        description="Manage audiences, segments, and data imports"
            >
                <div
                    className="h-8 w-8 rounded-md border flex items-center justify-center bg-card shadow-sm text-muted-foreground">
                    <HugeIcon name="UserGroupIcon" size={16}/>
                </div>
            </PageHeader>

            <div className="grid gap-4 md:grid-cols-4">

                {/* Filtered Profiles Metric Card */}
                <MetricCard title="Filtered / Total Audience"
                            icon="UserMultipleIcon"
                            variant="primary"
                >
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-3xl font-black tracking-tighter">
                            {total.toLocaleString()}
                        </span>
                        <span className="text-sm font-bold text-muted-foreground">
                            / {totalAudience.toLocaleString()}
                        </span>
                    </div>
                </MetricCard>

                {/* Total Segments Metric Card */}
                <MetricCard title="Total Segments"
                            value={segments.length}
                            icon="Folder01Icon"
                            variant="primary"
                />

                {/* Active Imports Metric Card */}
                <MetricCard title="Imports (Active / Done)"
                            icon="CloudUploadIcon"
                            variant="warning"
                >
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-3xl font-black tracking-tighter text-amber-600">
                            {activeImports}
                        </span>
                        <span className="text-sm font-bold text-amber-600/50">
                            / {completedImports}
                        </span>
                    </div>
                </MetricCard>

                {/* Unsubscribed Contacts (List Health) */}
                <MetricCard title="Unsubscribed (Email / SMS)"
                            icon="MailBlock01Icon"
                            variant="destructive"
                >
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                        {/* Email Unsubscribes */}
                        <span className="text-3xl font-black tracking-tighter text-rose-600">
                            {unsubscribedCounts.emailUnsubscribe.toLocaleString()}
                        </span>
                        {/* Phone Unsubscribes */}
                        <span className="text-sm font-bold text-rose-600/50">
                            / {unsubscribedCounts.phoneUnsubscribe.toLocaleString()}
                        </span>
                    </div>
                </MetricCard>

            </div>

            {/* Main Content (Side-by-Side Layout) */}
            <div className="flex flex-col md:flex-row gap-6 pt-2">

                {/* Left: segments sidebar */}
                <aside className="w-full md:w-48 flex-shrink-0">
                    <SegmentsPanel segments={segments} activeSegmentId={segmentId || undefined}/>
                </aside>

                {/* Right: main content */}
                <main className="flex-1 min-w-0">
                    <AudienceTable audiences={audiences}
                                   total={total}
                                   segments={segments}
                                   page={page}
                                   pageSize={pageSize}
                                   search={search}
                                   segmentId={segmentId}
                                   importJobs={importJobs}
                    />
                </main>

            </div>
        </div>
    );
}