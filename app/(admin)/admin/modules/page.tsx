import {unstable_noStore as noStore} from "next/cache";
import {fetchAllModules, fetchAllUsersWithPermissions} from "@/lib/actions/admin/module";
import {ModulesManager} from "./_components/modules-manager";
import {HugeIcon} from "@/components/huge-icon";
import {PageHeader} from "@/components/page-header";

export default async function AdminModulesPage() {
    noStore();

    const users = await fetchAllUsersWithPermissions();
    const modules = await fetchAllModules();

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-2">

            <PageHeader
                title="Modules Management"
                description="System-wide feature provisioning"
                tag="Admin Only"
                tagClassName="text-rose-600"
            >
                <div
                    className="h-8 w-8 rounded-md border flex items-center justify-center bg-card shadow-sm text-muted-foreground">
                    <HugeIcon name="TwoFactorAccessIcon" size={16}/>
                </div>
            </PageHeader>

            <ModulesManager
                users={users}
                modules={modules}
            />
        </div>
    );
}