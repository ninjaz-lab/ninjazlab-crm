import {useCallback, useMemo, useState} from "react";
import {TRANSACTION_STATUS} from "@/lib/enums";

interface UseBillingTransactionsProps {
    transactions: any[];
}

export function useBillingTransactions({transactions}: UseBillingTransactionsProps) {
    const [statusFilter, setStatusFilter] = useState<string>(TRANSACTION_STATUS.PENDING);

    const metrics = useMemo(() => {
        return {
            pending: transactions.filter(t => (t.status || TRANSACTION_STATUS.PENDING) === TRANSACTION_STATUS.PENDING).length,
            approved: transactions.filter(t => (t.status || TRANSACTION_STATUS.PENDING) === TRANSACTION_STATUS.APPROVED).length,
            rejected: transactions.filter(t => (t.status || TRANSACTION_STATUS.PENDING) === TRANSACTION_STATUS.REJECTED).length,
        };
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        if (statusFilter === "ALL") return transactions;
        return transactions.filter(tx => (tx.status || TRANSACTION_STATUS.PENDING) === statusFilter);
    }, [transactions, statusFilter]);

    const globalFilterFn = useCallback((row: any, columnId: string, filterValue: string) => {
        if (!filterValue) return true;
        const q = filterValue.toLowerCase();

        return (
            (row.original.userName?.toLowerCase() || "").includes(q) ||
            (row.original.userEmail?.toLowerCase() || "").includes(q) ||
            (row.original.description?.toLowerCase() || "").includes(q) ||
            (row.original.transactionId?.toLowerCase() || "").includes(q)
        );
    }, []);

    const filterOptions = useMemo(() => [
        {label: "All", value: "ALL"},
        {label: "Pending", value: TRANSACTION_STATUS.PENDING},
        {label: "Approved", value: TRANSACTION_STATUS.APPROVED},
        {label: "Rejected", value: TRANSACTION_STATUS.REJECTED},
    ], []);

    return {
        statusFilter,
        setStatusFilter,
        metrics,
        filteredTransactions,
        globalFilterFn,
        filterOptions,
    };
}
