import {unstable_noStore as noStore} from "next/cache";
import {fetchEmailTemplates} from "@/lib/actions/email-marketing";
import {fetchAudienceLists} from "@/lib/actions/audience";
import {CampaignForm} from "../../_components/campaign-form";

export default async function NewCampaignPage() {
    noStore();
    const [templates, segments] = await Promise.all([
        fetchEmailTemplates(),
        fetchAudienceLists(),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">New Campaign</h1>
                <p className="text-muted-foreground">Configure and schedule your email blast.</p>
            </div>
            <CampaignForm templates={templates} segments={segments}/>
        </div>
    );
}
