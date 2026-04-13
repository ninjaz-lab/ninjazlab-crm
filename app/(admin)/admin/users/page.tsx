import {unstable_noStore as noStore} from "next/cache";
import {headers} from "next/headers";
import {fetchAllUsersWithWallets} from "@/lib/actions/admin";
import {auth} from "@/lib/auth";
import {UsersTable} from "./_components/users-table";
import {HugeIcon} from "@/components/huge-icon";

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
            <div className="flex items-end justify-between border-b pb-4">
                <div className="space-y-0.5">
                    <h1 className="text-xl font-black tracking-tight uppercase">User Management</h1>
                    <p className="text-xs font-medium text-muted-foreground">
                        Manage roles, balances, and system access • <span
                        className="text-rose-600 uppercase font-black tracking-widest text-[9px]">Admin Only</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <div
                        className="h-8 w-8 rounded-md border flex items-center justify-center bg-card shadow-sm text-muted-foreground">
                        <HugeIcon name="UserGroupIcon" size={16}/>
                    </div>
                </div>
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