"use client";

import {useMemo} from "react";
import {getColumns} from "./columns";
import {QueueMetrics} from "@/app/(admin)/admin/queue/_components/queue-metrics";
import {DataTable} from "@/components/data-table/data-table";
import {HugeIcon} from "@/components/huge-icon";
import {Button} from "@/components/ui/button";
import {useQueueDashboard} from "@/hooks/use-queue-dashboard";

interface Props {
    data: any[];
    metrics: Record<string, number>;
}

export function QueueDashboard({data, metrics}: Props) {
    const {isPending, queueFilterFn, handleRefresh} = useQueueDashboard();

    const columns = useMemo(() => getColumns(), []);

    const actionSlot = (
        <Button variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isPending}
                className="h-9 text-xs font-bold gap-2 rounded-xl border-muted-foreground/20 hover:border-primary/40 transition-all"
        >
            <HugeIcon name="Refresh01Icon"
                      size={14}
                      className={isPending ? "animate-spin" : ""}
            />
            {isPending ? "Refreshing..." : "Refresh"}
        </Button>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-2">

            <QueueMetrics metrics={metrics}/>

            <DataTable columns={columns}
                       data={data}
                       searchPlaceholder="Search jobs, status, or campaigns..."
                       globalFilterFn={queueFilterFn}
                       actionSlot={actionSlot}
            />

        </div>
    );
}