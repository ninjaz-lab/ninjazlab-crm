import {unstable_noStore as noStore} from "next/cache";
import {db} from "@/lib/db";
import {user, userPermission, wallets, walletTransaction} from "@/lib/db/schema";
import {and, count, eq, gte, lt, sql} from "drizzle-orm";
import {Card, CardContent} from "@/components/ui/card";
import {HugeIcon} from "@/components/huge-icon";
import {USER_ROLES, WALLET_TYPES} from "@/lib/enums";
import {cn, formatAmount} from "@/lib/utils";
import {Progress} from "@/components/ui/progress";

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
        sum: sql<string>`coalesce(sum(
        ${wallets.balance}
        ),
        '0'
        )`
    }).from(wallets).where(eq(wallets.walletType, WALLET_TYPES.MAIN));

    const [netChangeRes] = await db.select({
        sum: sql<string>`coalesce(sum(
        ${walletTransaction.amount}
        ),
        '0'
        )`
    })
        .from(walletTransaction)
        .where(gte(walletTransaction.createdAt, thirtyDaysAgo));

    const currentBalance = parseFloat(totalBalanceRes.sum ?? "0");
    const netChange = parseFloat(netChangeRes.sum ?? "0");
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

    const statsConfig = [
        {
            title: "Platform Users",
            value: stats.users.total,
            changeAmount: stats.users.newCount,
            isAmountTrend: true,
            icon: "UserGroupIcon",
            color: "text-blue-600",
            bg: "bg-blue-600/5",
        },
        {
            title: "System Admins",
            value: stats.admins.total,
            description: "Active administrators",
            icon: "Shield02Icon",
            color: "text-rose-600",
            bg: "bg-rose-600/5",
        },
        {
            title: "System Liquidity",
            value: formatAmount(stats.liquidity.totalBalance),
            prefix: "MYR",
            trend: stats.liquidity.trend,
            isTrendPercentage: true,
            icon: "Coins01Icon",
            color: "text-emerald-600",
            bg: "bg-emerald-600/5",
        },
        {
            title: "Active Permissions",
            value: stats.permissions.total,
            trend: stats.permissions.trend,
            isTrendPercentage: true,
            icon: "Key01Icon",
            color: "text-amber-600",
            bg: "bg-amber-600/5",
        }
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-2">
            <div className="flex items-end justify-between border-b pb-4">
                <div className="space-y-0.5">
                    <h1 className="text-xl font-black tracking-tight uppercase">Admin Dashboard</h1>
                    <p className="text-xs font-medium text-muted-foreground">
                        System-wide monitoring •
                        <span
                            className="text-emerald-600 uppercase font-black tracking-widest text-[9px] animate-pulse">Live Sync</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <div
                        className="h-8 w-8 rounded-md border flex items-center justify-center bg-card shadow-sm text-muted-foreground">
                        <HugeIcon name="DashboardCircleIcon" size={16}/>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statsConfig.map((item) => (
                    <Card key={item.title} className="border shadow-sm overflow-hidden group bg-card">
                        <CardContent className="p-4 relative">
                            <div className="flex items-center gap-3">
                                <div
                                    className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg border shadow-sm transition-transform group-hover:scale-110", item.bg, item.color)}>
                                    <HugeIcon name={item.icon} size={20}/>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate mb-0.5">
                                        {item.title}
                                    </p>
                                    <div className="flex items-baseline justify-between gap-1.5">
                                        <h2 className="text-xl font-black tracking-tight tabular-nums">
                                            {item.prefix && <span
                                                className="text-sm font-bold text-muted-foreground mr-0.5">{item.prefix}</span>}
                                            {item.value}
                                        </h2>

                                        {item.isTrendPercentage ? (
                                            <div className={cn(
                                                "flex items-center text-[10px] font-black px-1.5 py-0.5 rounded-md",
                                                item.trend >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                            )}>
                                                <HugeIcon name={item.trend >= 0 ? "ArrowUp01Icon" : "ArrowDown01Icon"}
                                                          size={10} className="mr-1"/>
                                                {Math.abs(item.trend)}%
                                            </div>
                                        ) : item.isAmountTrend ? (
                                            <div
                                                className="flex items-center text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                                                <HugeIcon name="PlusSignIcon" size={10} className="mr-1"/>
                                                {item.changeAmount}
                                            </div>
                                        ) : (
                                            <span className="text-[9px] font-bold text-muted-foreground italic">
                                                {item.description}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-7">
                <div className="md:col-span-4 h-[350px] rounded-xl border bg-card shadow-sm flex flex-col">
                    <div className="p-4 border-b flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <HugeIcon name="ChartPie01Icon" size={14} className="text-primary"/>
                            Revenue Analytics
                        </span>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center bg-muted/5 relative">
                        <HugeIcon name="AiCloud01Icon" size={40} className="opacity-10 mb-2"/>
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-20">Real-time Charting Offline</span>
                    </div>
                </div>

                <div className="md:col-span-3 h-[350px] rounded-xl border bg-card shadow-sm flex flex-col">
                    <div className="p-4 border-b">
                        <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <HugeIcon name="ActivityIcon" size={14} className="text-primary"/>
                            System Health
                        </span>
                    </div>
                    <div className="flex-1 p-4 flex flex-col justify-center gap-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                                <span>API Response Time</span>
                                <span className="text-emerald-600">24ms</span>
                            </div>
                            <Progress value={15} className="h-1"/>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                                <span>Database Load</span>
                                <span className="text-amber-600">42%</span>
                            </div>
                            <Progress value={42} className="h-1"/>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                                <span>Worker Threads</span>
                                <span className="text-blue-600">Active</span>
                            </div>
                            <Progress value={88} className="h-1"/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}