import {unstable_noStore as noStore} from "next/cache";
import {fetchEmailTemplates} from "@/lib/actions/email-template";
import {NewCampaignForm} from "../_components/new-campaign-form";

export default async function NewCampaignPage() {
    noStore();
    const templates = await fetchEmailTemplates();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">New Campaign</h1>
                <p className="text-muted-foreground">Configure and schedule your email blast.</p>
            </div>
            <NewCampaignForm templates={templates}/>
        </div>
    );
}
