import {unstable_noStore as noStore} from "next/cache";
import {db} from "@/lib/db";
import {user, userPermission, wallets, walletTransaction} from "@/lib/db/schema";
import {and, count, eq, gte, lt, sum} from "drizzle-orm";
import {HugeIcon} from "@/components/huge-icon";
import {USER_ROLES, WALLET_TYPES} from "@/lib/enums";
import {cn} from "@/lib/utils/utils";
import {formatAmount} from "@/lib/utils/transactions";
import {Progress} from "@/components/ui/progress";
import {PageHeader} from "@/components/page-header";
import {MetricCard} from "@/components/metric-card";
import {DashboardPanel, EmptyState} from "@/components/dashboard-panel";
import {Routes} from "@/lib/constants/routes";

// Helper for percentage calculations
function calculateTrend(current: number, previous: number) {
    if (previous === 0)
        return current > 0 ? 100 : 0;
    const diff = ((current - previous) / previous) * 100;
    return parseFloat(diff.toFixed(1));
}

async function getStats() {
    noStore();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // 1. Users Stats
    const [totalUsers] = await db.select({count: count()}).from(user);
    const [newUsersCount] = await db.select({count: count()})
        .from(user)
        .where(gte(user.createdAt, thirtyDaysAgo));

    // 2. Admin Stats
    const [adminCount] = await db.select({count: count()})
        .from(user)
        .where(eq(user.role, USER_ROLES.ADMIN));

    // 3. System Liquidity
    const [totalBalanceRes] = await db.select({
        total: sum(wallets.balance)
    })
        .from(wallets)
        .where(eq(wallets.walletType, WALLET_TYPES.MAIN));

    const [netChangeRes] = await db.select({
        net: sum(walletTransaction.amount)
    })
        .from(walletTransaction)
        .where(gte(walletTransaction.createdAt, thirtyDaysAgo));

    const currentBalance = parseFloat(totalBalanceRes?.total ?? "0");
    const netChange = parseFloat(netChangeRes?.net ?? "0");
    const previousBalance = currentBalance - netChange;

    // 4. Permissions Stats
    const [totalPerms] = await db.select({count: count()})
        .from(userPermission)
        .where(eq(userPermission.enabled, true));

    const [recentPerms] = await db.select({count: count()})
        .from(userPermission)
        .where(and(eq(userPermission.enabled, true), gte(userPermission.createdAt, thirtyDaysAgo)));

    const [prevPerms] = await db.select({count: count()})
        .from(userPermission)
        .where(and(
            eq(userPermission.enabled, true),
            gte(userPermission.createdAt, sixtyDaysAgo),
            lt(userPermission.createdAt, thirtyDaysAgo)
        ));

    return {
        users: {
            total: totalUsers.count,
            newCount: newUsersCount.count
        },
        admins: {
            total: adminCount.count,
        },
        liquidity: {
            totalBalance: currentBalance.toFixed(2),
            trend: calculateTrend(currentBalance, previousBalance)
        },
        permissions: {
            total: totalPerms.count,
            trend: calculateTrend(recentPerms.count, prevPerms.count)
        }
    };
}

export default async function AdminDashboardPage() {
    const stats = await getStats();

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-2">

            <PageHeader title="Admin Dashboard"
                        description="System-wide monitoring"
                        tag="Admin Only"
                        tagClassName="text-rose-600"
            >
                <div
                    className="h-8 w-8 rounded-md border flex items-center justify-center bg-card shadow-sm text-muted-foreground">
                    <HugeIcon name="DashboardCircleIcon" size={16}/>
                </div>
            </PageHeader>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Platform Users"
                            icon="UserGroupIcon"
                            variant="primary"
                            href={Routes.ADMIN_USER}>
                    <div className="flex flex-col gap-1">
                            <span className="text-3xl font-black tracking-tighter text-primary">
                                {stats.users.total.toLocaleString()}
                            </span>
                        <div className="flex items-center text-[11px] font-bold text-primary/70">
                            <HugeIcon name="PlusSignIcon" size={12} className="mr-1"/>
                            {stats.users.newCount} New this month
                        </div>
                    </div>
                </MetricCard>

                <MetricCard title="System Admins"
                            icon="Shield02Icon"
                            variant="default"
                            href={Routes.ADMIN_USER}>
                    <div className="flex flex-col gap-1">
                            <span className="text-3xl font-black tracking-tighter text-foreground">
                                {stats.admins.total.toLocaleString()}
                            </span>
                        <span className="text-[11px] font-medium text-muted-foreground">
                                Active administrators
                            </span>
                    </div>
                </MetricCard>

                <MetricCard title="System Liquidity"
                            icon="Coins01Icon"
                            variant="success"
                            href={Routes.ADMIN_BILLING}>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-end gap-1.5 mt-0.5">
                                <span
                                    className="text-xs font-bold text-emerald-600/70 mb-1.5 uppercase tracking-widest">MYR</span>
                            <span
                                className="text-3xl font-black tracking-tighter text-emerald-600 group-hover:text-emerald-500 transition-colors">
                                    {formatAmount(stats.liquidity.totalBalance)}
                                </span>
                        </div>
                        <div className={cn(
                            "flex items-center text-[11px] font-bold w-fit",
                            stats.liquidity.trend >= 0 ? "text-emerald-600" : "text-rose-600"
                        )}>
                            <HugeIcon name={stats.liquidity.trend >= 0 ? "ArrowUp01Icon" : "ArrowDown01Icon"}
                                      size={12} className="mr-1"/>
                            {Math.abs(stats.liquidity.trend)}% vs last month
                        </div>
                    </div>
                </MetricCard>

                <MetricCard title="Active Permissions"
                            icon="Key01Icon"
                            variant="warning"
                            href={Routes.ADMIN_MODULES}>
                    <div className="flex flex-col gap-1">
                            <span
                                className="text-3xl font-black tracking-tighter text-amber-600 group-hover:text-amber-500 transition-colors">
                                {stats.permissions.total.toLocaleString()}
                            </span>
                        <div className={cn(
                            "flex items-center text-[11px] font-bold w-fit",
                            stats.permissions.trend >= 0 ? "text-amber-600" : "text-rose-600"
                        )}>
                            <HugeIcon name={stats.permissions.trend >= 0 ? "ArrowUp01Icon" : "ArrowDown01Icon"}
                                      size={12}
                                      className="mr-1"/>
                            {Math.abs(stats.permissions.trend)}% trend
                        </div>
                    </div>
                </MetricCard>
            </div>

            <div className="grid gap-6 md:grid-cols-7">

                {/* Revenue Analytics */}
                <DashboardPanel title="Revenue Analytics"
                                description="Real-time platform charting is currently offline."
                                icon="ChartPie01Icon"
                                className="md:col-span-4"
                                contentClassName="bg-muted/5 items-center justify-center p-8">
                    <EmptyState icon="AiCloud01Icon"
                                title="Analytics Unavailable"
                                description="Please check back later once data aggregation completes."/>
                </DashboardPanel>

                {/* System Health */}
                <DashboardPanel title="System Health"
                                description="Live telemetry from production servers."
                                icon="ActivityIcon"
                                className="md:col-span-3"
                                contentClassName="justify-center gap-8">
                    <div className="space-y-2.5">
                        <div className="flex justify-between text-sm font-semibold">
                            <span>API Response Time</span>
                            <span className="text-emerald-600">24ms</span>
                        </div>
                        <Progress value={15} className="h-2 bg-emerald-600/10 [&>div]:bg-emerald-600"/>
                    </div>

                </DashboardPanel>

            </div>
        </div>
    );
}