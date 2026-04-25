import {MetricCard} from "@/components/metric-card";

interface Props {
    metrics: Record<string, number>;
}

export function QueueMetrics({metrics}: Props) {
    return (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 overflow-visible">
            <MetricCard title="Active"
                        value={metrics.active || 0}
                        icon="ZapIcon"
                        variant="primary"
            />

            <MetricCard title="Waiting"
                        value={metrics.waiting || 0}
                        icon="Hold01Icon"
                        variant="warning"
            />

            <MetricCard title="Delayed"
                        value={metrics.delayed || 0}
                        icon="DeliveryDelay01Icon"
                        variant="default"
            />

            <MetricCard title="Failed"
                        value={metrics.failed || 0}
                        icon="CancelCircleIcon"
                        variant="destructive"
            />
        </div>
    )
}
