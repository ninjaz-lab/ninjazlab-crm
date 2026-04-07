import { unstable_noStore as noStore } from "next/cache";
import { getEmailTemplates, getEmailLists } from "@/lib/actions/email-marketing";
import { CampaignForm } from "../../_components/campaign-form";

export default async function NewCampaignPage() {
  noStore();
  const [templates, lists] = await Promise.all([
    getEmailTemplates(),
    getEmailLists(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Campaign</h1>
        <p className="text-muted-foreground">Configure and schedule your email blast.</p>
      </div>
      <CampaignForm templates={templates} lists={lists} />
    </div>
  );
}
