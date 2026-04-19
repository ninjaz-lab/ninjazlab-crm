import {unstable_noStore as noStore} from "next/cache";
import {headers} from "next/headers";
import {fetchAllUsersWithWallets} from "@/lib/actions/admin/users";
import {auth} from "@/lib/auth";
import {UsersTable} from "./_components/users-table";
import {HugeIcon} from "@/components/huge-icon";
import {PageHeader} from "@/components/page-header";

export default async function AdminUsersPage({
                                                 searchParams,
                                             }: {
    searchParams: Promise<{ page?: string; q?: string }>;
}) {
    noStore();
    const {page, q} = await searchParams;

    const currentPage = Number(page) || 1;
    const pageSize = 10;

    // Fetching data based on current page and search query
    const [{users, total}, session] = await Promise.all([
        fetchAllUsersWithWallets(currentPage, pageSize, q),
        auth.api.getSession({headers: await headers()})
    ]);

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-2">

            <PageHeader
                title="User Management"
                description="Manage roles, balances, and system access"
                tag="Admin Only"
                tagClassName="text-rose-600"
            >
                <div
                    className="h-8 w-8 rounded-md border flex items-center justify-center bg-card shadow-sm text-muted-foreground">
                    <HugeIcon name="AiUserIcon" size={16}/>
                </div>
            </PageHeader>

            <UsersTable
                currentUserId={session?.user.id ?? ""}
                users={users}
                total={total}
                page={currentPage}
                pageSize={pageSize}
            />
        </div>
    );
}