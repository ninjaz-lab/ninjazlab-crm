import {unstable_noStore as noStore} from "next/cache";
import {headers} from "next/headers";
import {UsersDashboard} from "./_components/users-dashboard";
import {HugeIcon} from "@/components/huge-icon";
import {PageHeader} from "@/components/page-header";
import {fetchAllUsersWithWallets} from "@/lib/actions/admin/users";
import {auth} from "@/lib/auth";
import {fetchAllModules} from "@/lib/actions/admin/module";

interface Props {
    searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function AdminUsersPage({searchParams,}: Props) {
    noStore();
    const {page, q} = await searchParams;

    const currentPage = Number(page) || 1;
    const pageSize = 10;

    // Fetching data based on current page and search query
    const [{users, totalUsers}, session, allModules] = await Promise.all([
        fetchAllUsersWithWallets(currentPage, pageSize, q),
        auth.api.getSession({headers: await headers()}),
        fetchAllModules()
    ]);

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-2">

            <PageHeader title="Users"
                        description="Manage system users and their permissions"
                        tag="Admin Only"
                        tagClassName="text-rose-600">
                <div
                    className="h-8 w-8 rounded-md border flex items-center justify-center bg-card shadow-sm text-muted-foreground">
                    <HugeIcon name="UserGroupIcon" size={16}/>
                </div>
            </PageHeader>

            <UsersDashboard currentUserId={session?.user.id ?? ""}
                            users={users}
                            totalUsers={totalUsers}
                            totalModules={allModules.length}
                            page={currentPage}
                            pageSize={pageSize}
            />
        </div>
    );
}