import {unstable_noStore as noStore} from "next/cache";
import {notFound} from "next/navigation";
import {fetchEmailTemplateById} from "@/lib/actions/email-template";
import {TemplateEditor} from "../../_components/template-editor";
import {CAMPAIGN_STATUS} from "@/lib/enums";

export default async function EditTemplatePage({
                                                   params,
                                               }: {
    params: Promise<{ id: string }>;
}) {
    noStore();
    const {id} = await params;
    const row = await fetchEmailTemplateById(id);
    if (!row) notFound();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Edit Template</h1>
            </div>
            <TemplateEditor
                templateId={id}
                defaultValues={{
                    name: row.marketing_template.name,
                    subject: row.email_template_detail.subject,
                    previewText: row.email_template_detail.previewText ?? "",
                    htmlBody: row.email_template_detail.htmlBody,
                    status: row.marketing_template.status as typeof CAMPAIGN_STATUS.DRAFT | typeof CAMPAIGN_STATUS.PUBLISHED,
                }}
            />
        </div>
    );
}