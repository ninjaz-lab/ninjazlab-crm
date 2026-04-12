"use client";

import {useMemo} from "react";
import {DataTable} from "@/components/data-table";
import {getColumns} from "./columns";

interface AdminBillingTableProps {
    transactions: any[];
}

export function AdminBillingTable({transactions}: AdminBillingTableProps) {
    // useMemo prevents the columns from re-rendering on every state change
    const columns = useMemo(() => getColumns(), []);

    return (
        <div className="space-y-6">
            <DataTable
                columns={columns}
                data={transactions}
                searchPlaceholder="Search by user or details..."
            />
        </div>
    );
}