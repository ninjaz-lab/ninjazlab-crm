import {unstable_noStore as noStore} from "next/cache";
import {fetchEmailCampaigns} from "@/lib/actions/email-marketing";
import {fetchEmailTemplates} from "@/lib/actions/email-template";
import {HugeIcon} from "@/components/huge-icon";
import {EmailDashboard} from "./_components/email-dashboard";
import {PageHeader} from "@/components/page-header";
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

            <PageHeader title="Email Campaigns"
                        description="Create, schedule and track email campaigns"
            >
                <div
                    className="h-8 w-8 rounded-md border flex items-center justify-center bg-card shadow-sm text-muted-foreground">
                    <HugeIcon name="Mail02Icon" size={18}/>
                </div>

            </PageHeader>

            <div className="grid gap-4 md:grid-cols-4">

                {/* Total Campaigns Metric Card */}
                <MetricCard title="Total Campaigns"
                            value={campaigns.length}
                            icon="Megaphone01Icon"
                            variant="primary"
                />

                {/* Total Templates Card */}
                <MetricCard title="Total Templates"
                            value={templates.length}
                            icon="Note01Icon"
                            variant="primary"
                />

                {/* Total Emails Sent Card */}
                <MetricCard title="Total Emails Sent"
                            value={totalSent.toLocaleString()}
                            icon="SentIcon"
                            variant="success"
                />

                {/* Average Open Rate Metric Card */}
                <MetricCard title="Avg Open Rate"
                            value={`${avgOpenRate}%`}
                            icon="ViewIcon"
                            variant="success"
                />
            </div>

            <EmailDashboard campaigns={campaigns}
                            templates={templates}
                            initialTab={activeTab}
            />
        </div>
    );
}
