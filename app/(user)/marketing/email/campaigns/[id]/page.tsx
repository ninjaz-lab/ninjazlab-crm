import {unstable_noStore as noStore} from "next/cache";
import {notFound} from "next/navigation";
import {fetchEmailCampaignById} from "@/lib/actions/email-marketing";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Separator} from "@/components/ui/separator";
import {CampaignActions} from "../_components/campaign-actions";
import {AlertTriangle, CheckCircle, Eye, Mail, MousePointerClick, Users,} from "lucide-react";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "secondary",
    scheduled: "outline",
    sending: "default",
    sent: "default",
    paused: "secondary",
    cancelled: "destructive",
};

export default async function CampaignDetailPage(
    {
        params,
    }: {
        params: Promise<{ id: string }>;
    }
) {
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
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
                    <p className="text-muted-foreground">
                        From: {detail.fromName} &lt;{detail.fromEmail}&gt;
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant={statusVariant[campaign.status] ?? "secondary"} className="text-sm px-3 py-1">
                        {campaign.status}
                    </Badge>
                    <CampaignActions campaignId={id} status={campaign.status} scheduledAt={campaign.scheduledAt}/>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                {[
                    {label: "Recipients", value: campaign.totalRecipients, icon: Users},
                    {label: "Sent", value: sentCount, icon: Mail},
                    {label: "Delivered", value: campaign.deliveredCount, icon: CheckCircle},
                    {label: `Open Rate`, value: `${openRate}%`, icon: Eye},
                    {label: `Click Rate`, value: `${clickRate}%`, icon: MousePointerClick},
                    {label: `Bounce Rate`, value: `${bounceRate}%`, icon: AlertTriangle},
                ].map(({label, value, icon: Icon}) => (
                    <Card key={label}>
                        <CardHeader className="pb-1 pt-4">
                            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Icon className="size-3"/>
                                {label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4">
                            <p className="text-2xl font-bold">{value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Campaign details */}
            <Card>
                <CardHeader>
                    <CardTitle>Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-sm font-medium">From</p>
                            <p className="text-sm text-muted-foreground">
                                {detail.fromName} &lt;{detail.fromEmail}&gt;
                            </p>
                        </div>
                        {detail.replyTo && (
                            <div>
                                <p className="text-sm font-medium">Reply To</p>
                                <p className="text-sm text-muted-foreground">{detail.replyTo}</p>
                            </div>
                        )}
                        {campaign.scheduledAt && (
                            <div>
                                <p className="text-sm font-medium">Scheduled At</p>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(campaign.scheduledAt).toLocaleString()}
                                </p>
                            </div>
                        )}
                        {campaign.startedAt && (
                            <div>
                                <p className="text-sm font-medium">Started At</p>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(campaign.startedAt).toLocaleString()}
                                </p>
                            </div>
                        )}
                        {campaign.completedAt && (
                            <div>
                                <p className="text-sm font-medium">Completed At</p>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(campaign.completedAt).toLocaleString()}
                                </p>
                            </div>
                        )}
                    </div>

                    {(detail.utmSource || detail.utmMedium || detail.utmCampaign) && (
                        <>
                            <Separator/>
                            <div className="grid gap-4 md:grid-cols-3">
                                {detail.utmSource && (
                                    <div>
                                        <p className="text-sm font-medium">UTM Source</p>
                                        <p className="text-sm text-muted-foreground">{detail.utmSource}</p>
                                    </div>
                                )}
                                {detail.utmMedium && (
                                    <div>
                                        <p className="text-sm font-medium">UTM Medium</p>
                                        <p className="text-sm text-muted-foreground">{detail.utmMedium}</p>
                                    </div>
                                )}
                                {detail.utmCampaign && (
                                    <div>
                                        <p className="text-sm font-medium">UTM Campaign</p>
                                        <p className="text-sm text-muted-foreground">{detail.utmCampaign}</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
