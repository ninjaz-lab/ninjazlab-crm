import {unstable_noStore as noStore} from "next/cache";
import {headers} from "next/headers";
import {UsersDashboard} from "./_components/users-dashboard";
import {HugeIcon} from "@/components/huge-icon";
import {PageHeader} from "@/components/page-header";
import {fetchAllUsersWithWallets} from "@/lib/actions/admin/users";
import {auth} from "@/lib/auth";
import {fetchAllModules} from "@/lib/actions/admin/module";
import {db} from "@/lib/db";
import {user} from "@/lib/db/schema";
import {count, eq} from "drizzle-orm";
import {USER_ROLES} from "@/lib/enums";
import {ADMIN_CONTAINER_CLASS} from "@/lib/constants/admin";

interface Props {
    searchParams: Promise<{ page?: string; q?: string; role?: string }>;
}

export default async function AdminUsersPage({searchParams,}: Props) {
    noStore();
    const {page, q, role} = await searchParams;

    const currentPage = Number(page) || 1;
    const pageSize = 10;
    const currentRole = role || null;

    // Fetching data based on current page and search query
    const [{users, totalUsers}, session, allModules, superadminCount, adminCount, userCount] = await Promise.all([
        fetchAllUsersWithWallets(currentPage, pageSize, q),
        auth.api.getSession({headers: await headers()}),
        fetchAllModules(),
        db.select({count: count()}).from(user).where(eq(user.role, USER_ROLES.SUPERADMIN)),
        db.select({count: count()}).from(user).where(eq(user.role, USER_ROLES.ADMIN)),
        db.select({count: count()}).from(user).where(eq(user.role, USER_ROLES.USER)),
    ]);

    const totalSuperadmins = superadminCount[0].count;
    const totalAdmins = adminCount[0].count;
    const totalRegularUsers = userCount[0].count;

    return (
        <div className={ADMIN_CONTAINER_CLASS}>

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
                            totalSuperadmins={totalSuperadmins}
                            totalAdmins={totalAdmins}
                            totalRegularUsers={totalRegularUsers}
                            currentRole={currentRole}
            />
        </div>
    );
}