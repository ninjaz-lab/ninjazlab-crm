import {MetricCard} from "@/components/metric-card";
import {TRANSACTION_STATUS} from "@/lib/enums";

interface Props {
    metrics: {
        pending: number;
        approved: number;
        rejected: number;
    };
    setStatusFilter: (status: string) => void;
}

export function BillingMetrics({metrics, setStatusFilter}: Props) {
    return (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 overflow-visible">
            <div onClick={() => setStatusFilter(TRANSACTION_STATUS.PENDING)}>
                <MetricCard title="Pending"
                            value={metrics.pending}
                            icon="Hold01Icon"
                            variant="warning"/>
            </div>

            <div onClick={() => setStatusFilter(TRANSACTION_STATUS.APPROVED)}>
                <MetricCard title="Approved"
                            value={metrics.approved}
                            icon="CheckmarkCircle01Icon"
                            variant="success"/>
            </div>

            <div onClick={() => setStatusFilter(TRANSACTION_STATUS.REJECTED)}>
                <MetricCard title="Rejected"
                            value={metrics.rejected}
                            icon="CancelCircleIcon"
                            variant="destructive"/>
            </div>

        </div>
    );
}
