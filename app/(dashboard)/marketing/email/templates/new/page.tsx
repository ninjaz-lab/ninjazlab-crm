import {unstable_noStore as noStore} from "next/cache";
import {CAMPAIGN_STATUS} from "@/lib/enums";
import {fetchEmailTemplateById} from "@/lib/actions/email-template";
import {TemplateEditorV2} from "@/app/(dashboard)/marketing/email/_components/template-editor-v2";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {ArrowLeft, Sparkles} from "lucide-react";

export default async function NewTemplatePage({searchParams}: {
                                                  searchParams: Promise<{ cloneFrom?: string }>
                                              }
) {
    noStore();
    const {cloneFrom} = await searchParams;

    let defaultValues;

    if (cloneFrom) {
        const row = await fetchEmailTemplateById(cloneFrom);
        if (row)
            defaultValues = {
                name: `${row.marketing_template.name} (Copy)`,
                subject: row.email_template_detail.subject,
                previewText: row.email_template_detail.previewText ?? "",
                htmlBody: row.email_template_detail.htmlBody,
                jsonBody: row.email_template_detail.jsonBody,
                status: CAMPAIGN_STATUS.DRAFT,
            };
    }

    return (
        <div className="flex flex-col h-full gap-4">

            <div className="flex items-center gap-4 shrink-0 px-1">
                <Button variant="outline" size="icon" className="size-8 rounded-full shadow-sm" asChild>
                    <Link href="/marketing/email?tab=templates">
                        <ArrowLeft className="size-4 text-muted-foreground"/>
                    </Link>
                </Button>

                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            {cloneFrom ? "Clone Template" : "Create Template"}
                        </h1>
                        {!cloneFrom && (
                            <span
                                className="flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                <Sparkles className="size-3"/> New
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Design your email using the drag-and-drop builder.
                    </p>
                </div>
            </div>

            {/* THE EDITOR */}
            <div className="flex-1 min-h-0">
                <TemplateEditorV2 defaultValues={defaultValues}/>
            </div>

        </div>
    );
}
