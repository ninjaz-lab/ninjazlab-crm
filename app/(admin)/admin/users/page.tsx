import {unstable_noStore as noStore} from "next/cache";
import {headers} from "next/headers";
import {fetchAllUsersWithWallets} from "@/lib/actions/admin";
import {auth} from "@/lib/auth";
import {UsersTable} from "./_components/users-table";

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
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <p className="text-muted-foreground">
                    Manage roles, balances, and system access.
                </p>
            </div>
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
