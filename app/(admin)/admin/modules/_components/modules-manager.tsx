"use client";

import {useMemo, useState} from "react";
import {DataTable} from "@/components/data-table";
import {getColumns} from "@/app/(admin)/admin/modules/_components/columns";
import {ModulePermissionSheet} from "./module-permission-sheet";

export function ModulesManager({users, modules}: { users: any[], modules: any[] }) {
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    const columns = useMemo(
        () => getColumns(modules.length, setSelectedUser),
        [modules.length]
    );

    const modulesFilterFn = (row: any, columnId: string, filterValue: string) => {
        const name = row.original.name?.toLowerCase() || "";
        const email = row.original.email?.toLowerCase() || "";
        const val = filterValue.toLowerCase();
        return name.includes(val) || email.includes(val);
    };

    return (
        <div className="space-y-6">
            <DataTable
                columns={columns}
                data={users}
                searchPlaceholder="Filter users by name or email..."
                globalFilterFn={modulesFilterFn}
                onRowClick={(row) => setSelectedUser(row)}
            />

            <ModulePermissionSheet
                user={selectedUser}
                modules={modules}
                isOpen={!!selectedUser}
                onClose={() => setSelectedUser(null)}
                onUpdateUser={(updatedUser) => setSelectedUser(updatedUser)}
            />
        </div>
    );
}