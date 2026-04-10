import {unstable_noStore as noStore} from "next/cache";
import {fetchAllAppModules, fetchAllUsersWithPermissions} from "@/lib/actions/admin";
import {UserModulesManager} from "./user-modules-manager"; // We will create this next!

export default async function AdminModulesPage() {
    noStore();

    // Fetch users (with their permissions map) and the actual module definitions
    const users = await fetchAllUsersWithPermissions();
    const modules = await fetchAllAppModules();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Module Access</h1>
                <p className="text-muted-foreground">
                    Control which features and modules each user can access.
                </p>
            </div>

            {/* Pass the data to our interactive client component */}
            <UserModulesManager users={users} modules={modules}/>
        </div>
    );
}