import {unstable_noStore as noStore} from "next/cache";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ShieldCheck, ToggleLeft, Users, Wallet} from "lucide-react";
import {db} from "@/lib/db";
import {user, userAccount, userPermission} from "@/lib/db/schema";
import {count, sql} from "drizzle-orm";

async function getStats() {
  noStore();
  const [totalUsers] = await db.select({ count: count() }).from(user);
  const [adminCount] = await db
    .select({ count: count() })
    .from(user)
    .where(sql`${user.role} = 'admin'`);
  const [totalBalance] = await db
    .select({ sum: sql<string>`coalesce(sum(${userAccount.balance}), 0)` })
    .from(userAccount);
  const [permCount] = await db.select({ count: count() }).from(userPermission).where(sql`${userPermission.enabled} = true`);

  return {
    totalUsers: totalUsers.count,
    adminCount: adminCount.count,
    totalBalance: parseFloat(totalBalance.sum ?? "0").toFixed(2),
    activePermissions: permCount.count,
  };
}

export default async function AdminOverviewPage() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
        <p className="text-muted-foreground">System-wide stats and management.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.adminCount}</div>
            <p className="text-xs text-muted-foreground">Admin role users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalBalance}</div>
            <p className="text-xs text-muted-foreground">Across all accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Permissions</CardTitle>
            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
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
