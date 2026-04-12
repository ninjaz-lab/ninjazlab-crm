import {unstable_noStore as noStore} from "next/cache";
import {fetchAllModules, fetchAllUsersWithPermissions} from "@/lib/actions/admin";
import {ModulesManager} from "./_components/modules-manager";

export default async function AdminModulesPage() {
    noStore();

    // Fetch users (with their permissions map) and the actual module definitions
    const users = await fetchAllUsersWithPermissions();
    const modules = await fetchAllModules();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Module Access</h1>
                <p className="text-muted-foreground">
                    Control which features and modules each user can access.
                </p>
            </div>

            {/* Pass the data to our interactive client component */}
            <ModulesManager users={users} modules={modules}/>
        </div>
    );
}