import {unstable_noStore as noStore} from "next/cache";
import Link from "next/link";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {HugeIcon} from "@/components/huge-icon";
import {PageHeader} from "@/components/page-header";
import {getSession} from "@/lib/session";
import {db} from "@/lib/db";
import {and, count, desc, eq} from "drizzle-orm";
import {audience, audienceList, marketingCampaign, wallets} from "@/lib/db/schema";
import {WALLET_TYPES} from "@/lib/enums";
import {MetricCard} from "@/components/metric-card";
import {Routes} from "@/lib/constants/routes";

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
        <div className="max-w-7xl mx-auto space-y-6 p-2 animate-in fade-in duration-500">

            <PageHeader title="Dashboard"
                        description="Welcome back! Here's your real-time platform overview."
            >
                <div
                    className="h-8 w-8 rounded-md border flex items-center justify-center bg-card shadow-sm text-primary">
                    <HugeIcon name="DashboardCircleIcon" size={16}/>
                </div>
            </PageHeader>

            {/* Top Metrics Row - Now Clickable & Interactive */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Total Audiences"
                            value={totalAudiences.toLocaleString()}
                            icon="UserGroupIcon"
                            variant="primary"
                            href="/audience"
                />

                <MetricCard title="Total Campaigns"
                            value={totalCampaigns.toLocaleString()}
                            icon="Megaphone01Icon"
                            variant="default"
                            href={Routes.USER_EMAIL_CAMPAIGNS}
                />

                <MetricCard title="Total Segments"
                            value={totalSegments.toLocaleString()}
                            icon="Folder01Icon"
                            variant="default"
                            href="/audience"
                />

                <MetricCard title="Available Balance"
                            icon="MoneyBag02Icon"
                            variant="success"
                            href={Routes.USER_BILLING}
                >
                    <div className="flex items-end gap-1.5 mt-0.5">
                        <span className="text-xs font-bold text-emerald-600/70 mb-1.5">MYR</span>
                        <span
                            className="text-3xl font-black tracking-tighter text-emerald-600 group-hover:text-emerald-500 transition-colors">
                                    {Number(wallet?.balance || 0).toLocaleString("en-MY", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}
                                </span>
                    </div>
                </MetricCard>

            </div>

            <div className="grid gap-6 md:grid-cols-2">

                {/* Highly Interactive Quick Actions */}
                <Card
                    className="rounded-2xl shadow-sm border-muted-foreground/20 hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
                        <CardDescription>Get right back to work with these shortcuts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Button asChild variant="outline"
                                    className="group h-16 justify-start px-4 rounded-xl border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm transition-all duration-300 overflow-hidden relative">
                                <Link href="/email/campaigns/new">
                                    <div
                                        className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"/>
                                    <HugeIcon name="Mail02Icon" size={20}
                                              className="mr-3 text-primary shrink-0 group-hover:scale-110 transition-transform duration-300"/>
                                    <div className="flex flex-col items-start leading-tight flex-1">
                                        <span
                                            className="font-semibold text-sm group-hover:text-primary transition-colors">New Email Campaign</span>
                                        <span
                                            className="text-[10px] text-muted-foreground font-medium">Draft an email</span>
                                    </div>
                                    <HugeIcon name="ArrowRight01Icon" size={16}
                                              className="text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"/>
                                </Link>
                            </Button>

                            <Button asChild variant="outline"
                                    className="group h-16 justify-start px-4 rounded-xl border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm transition-all duration-300 overflow-hidden relative">
                                <Link href="/audience">
                                    <div
                                        className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"/>
                                    <HugeIcon name="UserAdd01Icon" size={20}
                                              className="mr-3 text-primary shrink-0 group-hover:scale-110 transition-transform duration-300"/>
                                    <div className="flex flex-col items-start leading-tight flex-1">
                                        <span
                                            className="font-semibold text-sm group-hover:text-primary transition-colors">Add Audience</span>
                                        <span
                                            className="text-[10px] text-muted-foreground font-medium">Import audience</span>
                                    </div>
                                    <HugeIcon name="ArrowRight01Icon" size={16}
                                              className="text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"/>
                                </Link>
                            </Button>

                            <Button asChild variant="outline"
                                    className="group h-16 justify-start px-4 rounded-xl border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm transition-all duration-300 overflow-hidden relative sm:col-span-2">
                                <Link href={Routes.USER_BILLING}>
                                    <div
                                        className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"/>
                                    <HugeIcon name="MoneyBag02Icon" size={20}
                                              className="mr-3 text-primary shrink-0 group-hover:scale-110 transition-transform duration-300"/>
                                    <div className="flex flex-col items-start leading-tight flex-1">
                                        <span
                                            className="font-semibold text-sm group-hover:text-primary transition-colors">Top Up Wallet</span>
                                        <span className="text-[10px] text-muted-foreground font-medium">Add credits to your account</span>
                                    </div>
                                    <HugeIcon name="ArrowRight01Icon" size={16}
                                              className="text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"/>
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Interactive Recent Activity Feed */}
                <Card
                    className="rounded-2xl shadow-sm border-muted-foreground/20 flex flex-col hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-bold">Recently Added</CardTitle>
                        <CardDescription>The latest contacts to join your audience.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        {recentProfiles.length === 0 ? (
                            <div
                                className="h-full flex flex-col items-center justify-center text-center space-y-3 p-6 bg-muted/10 rounded-xl border border-dashed border-muted-foreground/20 hover:bg-muted/20 transition-colors duration-300">
                                <div
                                    className="p-3 bg-background rounded-full shadow-sm border border-muted-foreground/10">
                                    <HugeIcon name="UserGroupIcon" size={24} className="text-muted-foreground/60"/>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">No contacts yet</p>
                                    <p className="text-xs font-medium text-muted-foreground">Import your first list to
                                        get started.</p>
                                </div>
                                <Button asChild variant="secondary" size="sm"
                                        className="mt-2 h-8 text-xs font-bold rounded-lg hover:scale-105 transition-transform duration-300">
                                    <Link href="/audience">Add Contacts</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentProfiles.map((profile) => {
                                    const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Unknown User";
                                    const contact = profile.email || profile.phone || "No contact info";
                                    const initials = name.slice(0, 2).toUpperCase();

                                    return (
                                        <Link key={profile.id} href={`/audience`}
                                              className="group flex items-center justify-between p-3 rounded-xl border border-muted-foreground/10 bg-muted/10 hover:bg-background hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <Avatar
                                                    className="h-9 w-9 border border-background shadow-sm group-hover:border-primary/20 group-hover:scale-105 transition-all duration-300">
                                                    <AvatarFallback
                                                        className="bg-primary/10 text-primary text-xs font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                                                        {initials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="truncate">
                                                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{name}</p>
                                                    <p className="text-[11px] font-medium text-muted-foreground truncate">{contact}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0 ml-4">
                                                <div
                                                    className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest group-hover:text-primary/70 transition-colors">
                                                    {profile.createdAt ? new Intl.DateTimeFormat("en-US", {
                                                        month: "short",
                                                        day: "numeric"
                                                    }).format(profile.createdAt) : "New"}
                                                </div>
                                                <HugeIcon name="ArrowRight01Icon" size={14}
                                                          className="text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"/>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    )
        ;
}