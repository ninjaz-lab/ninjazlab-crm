import {unstable_noStore as noStore} from "next/cache";
import {fetchEmailCampaigns} from "@/lib/actions/email-marketing";
import {fetchEmailTemplates} from "@/lib/actions/email-template";
import {HugeIcon} from "@/components/huge-icon";
import {EmailMarketingTabs} from "./_components/email-marketing-tabs";
import {PageHeader} from "@/components/page-header";
import {Button} from "@/components/ui/button";
import {MetricCard} from "@/components/metric-card";

export default async function EmailMarketingPage({searchParams}: {
    searchParams: Promise<{ tab?: string }>;
}) {
    noStore();
    const [campaigns, templates] = await Promise.all([
        fetchEmailCampaigns(),
        fetchEmailTemplates(),
    ]);

    const {tab} = await searchParams;
    const activeTab = typeof tab === "string" && ["campaigns", "templates"].includes(tab)
        ? tab
        : "campaigns";

    const totalSent = campaigns.reduce((s, c) => s + (c.sentCount ?? 0), 0);
    const totalOpened = campaigns.reduce((s, c) => s + (c.openedCount ?? 0), 0);
    const avgOpenRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0.0";

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-2">

            {/* Page Header */}
            <PageHeader title="Email Marketing"
                        description="Create, schedule and track email campaigns"
            >

                <Button variant="outline" size="icon" className="size-9 rounded-lg text-muted-foreground">
                    <HugeIcon name="Mail02Icon" size={18}/>
                </Button>

            </PageHeader>

            <div className="grid gap-4 md:grid-cols-4">

                {/* Total Campaigns Metric Card */}
                <MetricCard title="Total Campaigns"
                            value={campaigns.length}
                            icon="Megaphone01Icon"
                            variant="default"
                />

                {/* Total Templates Card */}
                <MetricCard title="Total Templates"
                            value={templates.length}
                            icon="Note01Icon"
                            variant="default"
                />

                {/* Total Emails Sent Card */}
                <MetricCard title="Total Emails Sent"
                            value={totalSent.toLocaleString()}
                            icon="SentIcon"
                            variant="primary"
                />

                {/* Average Open Rate Metric Card */}
                <MetricCard title="Avg Open Rate"
                            value={`${avgOpenRate}%`}
                            icon="ViewIcon"
                            variant="success"
                />
            </div>

            <EmailMarketingTabs campaigns={campaigns}
                                templates={templates}
                                initialTab={activeTab}
            />
        </div>
    );
}
