import {notFound} from "next/navigation";
import {fetchEmailCampaignById} from "@/lib/actions/email-marketing";
import {fetchAudienceLists} from "@/lib/actions/audience"; // Check your import paths
import {unstable_noStore as noStore} from "next/cache";
import {EditCampaignForm} from "@/app/(user)/email/campaigns/_components/edit-campaign-form";
import {fetchEmailTemplates} from "@/lib/actions/email-template";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function EditCampaignPage({params}: Props) {
    noStore();
    const {id} = await params;

    const [row, templates, segments] = await Promise.all([
        fetchEmailCampaignById(id),
        fetchEmailTemplates(),
        fetchAudienceLists()
    ]);

    if (!row) notFound();

    const campaign = row.marketing_campaign;
    const detail = row.email_campaign_detail;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Edit Campaign</h1>
                <p className="text-muted-foreground">
                    Modifying: <span className="font-semibold text-foreground">{campaign.name}</span>
                </p>
            </div>

            <EditCampaignForm
                campaign={campaign}
                detail={detail}
                templates={templates || []}
                segments={segments || []}
            />
        </div>
    );
}