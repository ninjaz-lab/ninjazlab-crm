import {unstable_noStore as noStore} from "next/cache";
import {fetchAudienceLists, getAudiences, getImportJobs} from "@/lib/actions/audience";
import {AudienceTable} from "./_components/audience-table";
import {SegmentsPanel} from "./_components/segments-panel";

interface Props {
    searchParams: Promise<{ search?: string; segmentId?: string; page?: string; pageSize?: string }>;
}

export default async function AudiencePage({searchParams}: Props) {
    noStore();
    const sp = await searchParams;
    const search = sp.search ?? "";
    const segmentId = sp.segmentId ?? "";
    const page = Math.max(1, parseInt(sp.page ?? "1", 10));
    const pageSize = parseInt(sp.pageSize ?? "50", 10);

    const [{audiences, total}, segments, importJobs] = await Promise.all([
        getAudiences({search, listId: segmentId || undefined, page, pageSize}),
        fetchAudienceLists(),
        getImportJobs(),
    ]);

    return (
        <div className="flex h-full gap-6">
            {/* Left: segments sidebar */}
            <aside className="w-48 flex-shrink-0 space-y-4 pt-1">
                <SegmentsPanel segments={segments} activeSegmentId={segmentId || undefined}/>
            </aside>

            {/* Right: main content */}
            <main className="flex-1 min-w-0 space-y-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Audience</h1>
                    <p className="text-muted-foreground text-sm">
                        Central audience database — used across all marketing channels.
                    </p>
                </div>

                <AudienceTable
                    audiences={audiences}
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
    );
}
