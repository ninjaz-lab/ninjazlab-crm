import {unstable_noStore as noStore} from "next/cache";
import {db} from "@/lib/db";
import {user, userPermission, wallets} from "@/lib/db/schema";
import {count, eq, sql} from "drizzle-orm";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ShieldCheck, ToggleLeft, Users, Wallet} from "lucide-react";
import {USER_ROLES, WALLET_TYPES} from "@/lib/enums";

async function getStats() {
    noStore();

    // 1. Total User Count
    const [totalUsers] = await db.select({count: count()}).from(user);

    // 2. Admin Role Count
    const [adminCount] = await db
        .select({count: count()})
        .from(user)
        .where(eq(user.role, USER_ROLES.ADMIN));

    // 3. Total System Balance (Sum of all 'main' wallets)
    const [totalBalance] = await db
        .select({
            sum: sql<string>`coalesce(sum(
            ${wallets.balance}
            ),
            '0'
            )`
        })
        .from(wallets)
        .where(eq(wallets.walletType, WALLET_TYPES.MAIN));

    // 4. Enabled Permissions Count
    const [permCount] = await db
        .select({count: count()})
        .from(userPermission)
        .where(eq(userPermission.enabled, true));

    return {
        totalUsers: totalUsers.count,
        adminCount: adminCount.count,
        totalBalance: parseFloat(totalBalance.sum ?? "0").toFixed(2),
        activePermissions: permCount.count,
    };
}

export default async function AdminDashboardPage() {
    const stats = await getStats();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">System-wide stats and management.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">Registered accounts</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Admins</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.adminCount}</div>
                        <p className="text-xs text-muted-foreground">Admin role users</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">MYR {stats.totalBalance}</div>
                        <p className="text-xs text-muted-foreground">Across all accounts</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Permissions</CardTitle>
                        <ToggleLeft className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activePermissions}</div>
                        <p className="text-xs text-muted-foreground">Module grants enabled</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
