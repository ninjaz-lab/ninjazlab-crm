import {unstable_noStore as noStore} from "next/cache";
import {notFound} from "next/navigation";
import {fetchEmailTemplateById} from "@/lib/actions/email-template";
import {CAMPAIGN_STATUS} from "@/lib/enums";
import {TemplateEditorV2} from "@/app/(dashboard)/marketing/email/templates/_components/template-editor-v2";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {ArrowLeft} from "lucide-react";

export default async function EditTemplatePage({
                                                   params,
                                               }: {
    params: Promise<{ id: string }>;
}) {
    noStore();
    const {id} = await params;
    const row = await fetchEmailTemplateById(id);
    if (!row)
        notFound();

    return (
        <div className="flex flex-col h-full gap-4">

            <div className="flex items-center gap-4 shrink-0 px-1">
                <Button variant="outline" size="icon" className="size-8 rounded-full shadow-sm" asChild>
                    <Link href="/marketing/email?tab=templates">
                        <ArrowLeft className="size-4 text-muted-foreground"/>
                    </Link>
                </Button>

                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Edit Template
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Update your email using the drag-and-drop builder.
                    </p>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <TemplateEditorV2
                    templateId={id}
                    defaultValues={{
                        name: row.marketing_template.name,
                        subject: row.email_template_detail.subject,
                        previewText: row.email_template_detail.previewText ?? "",
                        htmlBody: row.email_template_detail.htmlBody,
                        jsonBody: row.email_template_detail.jsonBody,
                        status: row.marketing_template.status as typeof CAMPAIGN_STATUS.DRAFT | typeof CAMPAIGN_STATUS.PUBLISHED,
                    }}
                />
            </div>

        </div>
    );
}