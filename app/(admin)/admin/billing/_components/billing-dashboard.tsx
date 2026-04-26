"use client";

import {useMemo} from "react";
import {getColumns} from "./columns";
import {DataTable} from "@/components/data-table/data-table";
import {BillingMetrics} from "@/app/(admin)/admin/billing/_components/billing-metrics";
import {DataTableFilter} from "@/components/data-table/data-table-filter";
import {useBillingTransactions} from "@/hooks/use-billing-transactions";

interface Props {
    transactions: any[];
}

export function BillingDashboard({transactions}: Props) {
    const columns = useMemo(() => getColumns(), []);

    const {
        statusFilter,
        setStatusFilter,
        metrics,
        filteredTransactions,
        globalFilterFn,
        filterOptions,
    } = useBillingTransactions({transactions});

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