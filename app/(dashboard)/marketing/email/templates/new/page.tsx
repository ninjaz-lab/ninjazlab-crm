import {TemplateEditor} from "../../_components/template-editor";
import {CAMPAIGN_STATUS} from "@/lib/enums";
import {fetchEmailTemplateById} from "@/lib/actions/email-template";

export default async function NewTemplatePage({searchParams}: {
                                                  searchParams: Promise<{ cloneFrom?: string }>
                                              }
) {
    const {cloneFrom} = await searchParams;

    let defaultValues;

    // If the user clicked "Clone", fetch the old data to pre-fill the editor!
    if (cloneFrom) {
        const row = await fetchEmailTemplateById(cloneFrom);
        if (row)
            defaultValues = {
                name: `${row.marketing_template.name} (Copy)`,
                subject: row.email_template_detail.subject,
                previewText: row.email_template_detail.previewText ?? "",
                htmlBody: row.email_template_detail.htmlBody,
                status: CAMPAIGN_STATUS.DRAFT,
            };
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">New Template</h1>
                <p className="text-muted-foreground">Write your email in HTML.</p>
            </div>
            <TemplateEditor defaultValues={defaultValues}/>
        </div>
    );
}
