import {unstable_noStore as noStore} from "next/cache";
import {fetchAllModules, fetchAllUsersWithPermissions} from "@/lib/actions/admin";
import {ModulesManager} from "./_components/modules-manager";

export default async function AdminModulesPage() {
    noStore();

    const users = await fetchAllUsersWithPermissions();
    const modules = await fetchAllModules();

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-2">
            <div className="flex items-end justify-between border-b pb-4">
                <div className="space-y-0.5">
                    <h1 className="text-xl font-black tracking-tight uppercase">Modules Manager</h1>
                    <p className="text-xs font-medium text-muted-foreground">
                        System-wide feature provisioning • <span
                        className="text-rose-600 uppercase font-black tracking-widest text-[9px]">Admin Only</span>
                    </p>
                </div>
            </div>

            <ModulesManager users={users} modules={modules}/>
        </div>
    );
}