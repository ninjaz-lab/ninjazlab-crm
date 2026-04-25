import {useMemo, useState, useTransition} from "react";
import {setBulkModulePermissions} from "@/lib/actions/admin/module";
import {toast} from "sonner";
import {USER_ROLES} from "@/lib/enums";

export function useModulePermissions(user: any, modules: any[], onUpdateUser: (u: any) => void) {
    const [isPending, startTransition] = useTransition();
    const [moduleSearch, setModuleSearch] = useState("");
    const [pendingMessage, setPendingMessage] = useState("");

    const handleToggle = (userId: string, moduleId: string, currentlyEnabled: boolean) => {
        const newState = !currentlyEnabled;
        setPendingMessage("Updating permission...");

        startTransition(async () => {
            try {
                await setBulkModulePermissions(userId, [moduleId], newState);

                if (user?.id === userId) {
                    onUpdateUser({
                        ...user,
                        permissions: {...user.permissions, [moduleId]: !currentlyEnabled}
                    });
                }
                toast.success("Permission updated");
            } catch (e) {
                toast.error("Update failed");
            }
        });
    };

    const filteredModules = useMemo(() => {
        return modules.filter(m =>
            m.title.toLowerCase().includes(moduleSearch.toLowerCase())
        );
    }, [modules, moduleSearch]);

    const adminModules = useMemo(() => filteredModules.filter(m => m.scope === USER_ROLES.ADMIN), [filteredModules]);
    const userModules = useMemo(() => filteredModules.filter(m => m.scope === USER_ROLES.USER), [filteredModules]);

    const bulkUpdate = (enable: boolean) => {
        if (!user) return;

        const actionText = enable ? "Granting" : "Revoking";
        setPendingMessage(`${actionText} ${filteredModules.length} permissions...`);

        startTransition(async () => {
            try {
                const moduleIds = filteredModules.map(m => m.id);

                await setBulkModulePermissions(user.id, moduleIds, enable);

                const bulkPermUpdates = Object.fromEntries(
                    moduleIds.map(id => [id, enable])
                );

                onUpdateUser({
                    ...user,
                    permissions: {
                        ...user.permissions,
                        ...bulkPermUpdates // Merge new bulk perms into existing ones
                    }
                });

                toast.success(`${moduleIds.length} modules updated instantly`);
            } catch (e) {
                toast.error("Bulk update failed");
            }
        });
    };

    return {
        isPending, pendingMessage,
        moduleSearch, setModuleSearch,
        handleToggle,
        bulkUpdate,
        adminModules,
        userModules,
        filteredModules
    };
}