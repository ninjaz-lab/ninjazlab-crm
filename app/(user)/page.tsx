import {unstable_noStore as noStore} from "next/cache";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {DollarSign, ShoppingCart, TrendingUp, Users} from "lucide-react";
import {HugeIcon} from "@/components/huge-icon";
import {PageHeader} from "@/components/page-header";
import {getSession} from "@/lib/session";
import {db} from "@/lib/db";
import {and, count, desc, eq} from "drizzle-orm";
import {audience, audienceList, marketingCampaign, wallets} from "@/lib/db/schema";
import {WALLET_TYPES} from "@/lib/enums";
import {MetricCard} from "@/components/metric-card";

const stats = [
    {title: "Total Users", value: "12,345", change: "+12%", icon: Users},
    {title: "Revenue", value: "$45,231", change: "+8.2%", icon: DollarSign},
    {title: "Orders", value: "1,234", change: "+3.1%", icon: ShoppingCart},
    {title: "Growth", value: "23.5%", change: "+4.6%", icon: TrendingUp},
];

export default async function DashboardPage() {
    noStore();

    const session = await getSession();
    const userId = session.user.id;

    const [
        [{totalAudiences}],
        [{totalCampaigns}],
        [{totalSegments}],
        [wallet],
        recentProfiles
    ] = await Promise.all([
        db.select({totalAudiences: count()}).from(audience).where(eq(audience.userId, userId)),
        db.select({totalCampaigns: count()}).from(marketingCampaign).where(eq(marketingCampaign.userId, userId)),
        db.select({totalSegments: count()}).from(audienceList).where(eq(audienceList.userId, userId)),
        db.select().from(wallets).where(and(eq(wallets.userId, userId), eq(wallets.walletType, WALLET_TYPES.MAIN))),
        db.select().from(audience).where(eq(audience.userId, userId)).orderBy(desc(audience.createdAt)).limit(4)
    ]);

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-2">

            <PageHeader
                title="Dashboard"
                description="Welcome back! Here&apos;s what&apos;s happening"
            >
                <div
                    className="h-8 w-8 rounded-md border flex items-center justify-center bg-card shadow-sm text-muted-foreground">
                    <HugeIcon name="DashboardCircleIcon" size={16}/>
                </div>
            </PageHeader>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                <MetricCard
                    title="Total Audiences"
                    value={totalAudiences.toLocaleString()}
                    icon="UserGroupIcon"
                    variant="primary"
                />

                <MetricCard
                    title="Total Campaigns"
                    value={totalCampaigns.toLocaleString()}
                    icon="Megaphone01Icon"
                    variant="default"
                />

                <MetricCard
                    title="Total Segments"
                    value={totalSegments.toLocaleString()}
                    icon="Folder01Icon"
                    variant="default"
                />

                <MetricCard
                    title="Available Balance"
                    icon="MoneyBag02Icon"
                    variant="success"
                >
                    <div className="flex items-end gap-1.5 mt-0.5">
                        <span className="text-xs font-bold text-emerald-600/70 mb-1.5">MYR</span>
                        <span className="text-3xl font-black tracking-tighter text-emerald-600">
                            {Number(wallet?.balance || 0).toLocaleString("en-MY", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </span>
                    </div>
                </MetricCard>
            </div>

            <div className="grid gap-4 md:grid-cols-2">

                {/* Dynamic Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Audience Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentProfiles.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No profiles added yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {recentProfiles.map((profile) => (
                                    <div key={profile.id} className="flex items-center gap-3 text-sm">
                                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0"/>
                                        <p className="truncate">
                                            New profile added: <span
                                            className="font-medium text-foreground">{profile.firstName || 'Unknown'} {profile.lastName || ''}</span>
                                            <span
                                                className="text-muted-foreground ml-1">({profile.email || profile.phone || 'No contact info'})</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions (Kept Static for Now) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p>• Create a new email campaign</p>
                            <p>• Import your latest customer list</p>
                            <p>• View your billing and usage</p>
                            <p>• Top up your wallet balance</p>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
