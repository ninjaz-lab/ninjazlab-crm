import {unstable_noStore as noStore} from "next/cache";
import {notFound} from "next/navigation";
import {EditCampaignActions} from "../_components/edit-campaign-actions";
import {DashboardPanel, DataRow} from "@/components/dashboard-panel";
import {MetricCard} from "@/components/metric-card";
import {PageHeader} from "@/components/page-header";
import {Badge} from "@/components/ui/badge";
import {fetchEmailCampaignById} from "@/lib/actions/email-marketing";
import {formatDateTime} from "@/lib/utils/date";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "secondary",
    scheduled: "outline",
    sending: "default",
    sent: "default",
    paused: "secondary",
    cancelled: "destructive",
};

interface Props {
    params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({params}: Props) {
    noStore();

    const {id} = await params;
    const row = await fetchEmailCampaignById(id);
    if (!row) notFound();

    const campaign = row.marketing_campaign;
    const detail = row.email_campaign_detail;
    const sentCount = campaign.sentCount ?? 0;

    const openRate = sentCount > 0 ? ((campaign.openedCount / sentCount) * 100).toFixed(1) : "0.0";
    const clickRate = sentCount > 0 ? ((campaign.clickedCount / sentCount) * 100).toFixed(1) : "0.0";
    const bounceRate = sentCount > 0 ? ((campaign.bouncedCount / sentCount) * 100).toFixed(1) : "0.0";

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-2">

            {/* Page Header */}
            <PageHeader title={campaign.name}
                        description={`From: ${detail.fromName} <${detail.fromEmail}>`}
            >
                <div className="flex items-center gap-3">
                    <Badge variant={statusVariant[campaign.status] ?? "secondary"}
                           className="uppercase text-[10px] font-black tracking-widest px-3 py-1.5 shadow-sm"
                    >
                        {campaign.status}
                    </Badge>
                    <EditCampaignActions campaignId={id}
                                         status={campaign.status}
                                         scheduledAt={campaign.scheduledAt}
                    />
                </div>
            </PageHeader>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-3 overflow-visible">
                <MetricCard title="Recipients"
                            value={campaign.totalRecipients || 0}
                            icon="UserGroupIcon"
                            variant="primary"/>
                <MetricCard title="Sent"
                            value={sentCount}
                            icon="Mail01Icon"
                            variant="default"/>
                <MetricCard title="Delivered"
                            value={campaign.deliveredCount || 0}
                            icon="SentIcon"
                            variant="success"/>
                <MetricCard title="Open Rate"
                            value={`${openRate}%`}
                            icon="ViewIcon" variant="warning"/>
                <MetricCard title="Click Rate"
                            value={`${clickRate}%`}
                            icon="CursorIcon"
                            variant="primary"/>
                <MetricCard title="Bounce Rate"
                            value={`${bounceRate}%`}
                            icon="BounceRightIcon"
                            variant="destructive"/>
            </div>

            {/* Split Screen Details */}
            <div className="grid gap-6 lg:grid-cols-2 items-start">

                {/* Left Column: Sender Info */}
                <DashboardPanel title="Sender Details"
                                icon="ContactBookIcon">
                    <DataRow label="From Name" value={detail.fromName}/>
                    <DataRow label="From Email" value={detail.fromEmail}/>
                    <DataRow label="Reply-To Address" value={detail.replyTo || "—"}/>
                </DashboardPanel>

                {/* Right Column: Timeline & UTM */}
                <div className="space-y-6">

                    {/* Delivery Timeline */}
                    <DashboardPanel title="Delivery Timeline"
                                    icon="Calendar04Icon">
                        <DataRow label="Scheduled For" value={formatDateTime(campaign.scheduledAt)}/>
                        <DataRow label="Started At" value={formatDateTime(campaign.startedAt)}/>
                        <DataRow label="Completed At" value={formatDateTime(campaign.completedAt)}/>
                    </DashboardPanel>

                    {/* UTM Tracking (Only shows if there are UTMs) */}
                    {(detail.utmSource || detail.utmMedium || detail.utmCampaign) && (
                        <DashboardPanel title="Tracking Parameters"
                                        icon="Link01Icon">
                            <DataRow label="Source" value={detail.utmSource || "—"}/>
                            <DataRow label="Medium" value={detail.utmMedium || "—"}/>
                            <DataRow label="Campaign" value={detail.utmCampaign || "—"}/>
                        </DashboardPanel>
                    )}
                </div>
            </div>
        </div>
    );
}