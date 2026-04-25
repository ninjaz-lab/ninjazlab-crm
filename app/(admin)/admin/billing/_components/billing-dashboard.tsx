"use client";

import React, {useMemo, useState} from "react";
import {getColumns} from "./columns";
import {DataTable} from "@/components/data-table/data-table";
import {TRANSACTION_STATUS} from "@/lib/enums";
import {BillingMetrics} from "@/app/(admin)/admin/billing/_components/billing-metrics";
import {DataTableFilter} from "@/components/data-table/data-table-filter";

interface Props {
    transactions: any[];
}

export function BillingDashboard({transactions}: Props) {
    const columns = useMemo(() => getColumns(), []);

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

    const globalFilterFn = React.useCallback((row: any, columnId: string, filterValue: string) => {
        if (!filterValue) return true;
        const q = filterValue.toLowerCase();

        return (
            (row.original.userName?.toLowerCase() || "").includes(q) ||
            (row.original.userEmail?.toLowerCase() || "").includes(q) ||
            (row.original.description?.toLowerCase() || "").includes(q) ||
            (row.original.transactionId?.toLowerCase() || "").includes(q)
        );
    }, []);

    const filterOptions = [
        {label: "All Statuses", value: "ALL"},
        {label: "Pending", value: TRANSACTION_STATUS.PENDING},
        {label: "Approved", value: TRANSACTION_STATUS.APPROVED},
        {label: "Rejected", value: TRANSACTION_STATUS.REJECTED},
    ];

    return (
        <div className="space-y-6">

            <BillingMetrics metrics={metrics}
                            setStatusFilter={setStatusFilter}/>

            <DataTable columns={columns}
                       data={filteredTransactions}
                       globalFilterFn={globalFilterFn}
                       searchPlaceholder="Search by user or details..."
                       actionSlot={
                           <DataTableFilter icon="FilterIcon"
                                            value={statusFilter}
                                            onChange={setStatusFilter}
                                            options={filterOptions}
                           />
                       }/>
        </div>
    );
}