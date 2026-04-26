import {useCallback, useTransition} from "react";
import {useRouter} from "next/navigation";

export function useQueueDashboard() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const queueFilterFn = useCallback((row: any, columnId: string, filterValue: string) => {
        const q = filterValue.toLowerCase();
        return (
            (row.original.id?.toLowerCase() || "").includes(q) ||
            (row.original.status?.toLowerCase() || "").includes(q) ||
            (row.original.campaignId?.toLowerCase() || "").includes(q)
        );
    }, []);

    const handleRefresh = useCallback(() => {
        startTransition(() => {
            router.refresh();
        });
    }, [router]);

    return {
        isPending,
        queueFilterFn,
        handleRefresh,
    };
}
