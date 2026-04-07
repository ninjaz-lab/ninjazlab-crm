import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { getEmailTemplate } from "@/lib/actions/email-marketing";
import { TemplateEditor } from "../../_components/template-editor";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  noStore();
  const { id } = await params;
  const row = await getEmailTemplate(id);
  if (!row) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Template</h1>
        <p className="text-muted-foreground">
          {row.marketing_template.name}
        </p>
      </div>
      <TemplateEditor
        templateId={id}
        defaultValues={{
          name: row.marketing_template.name,
          subject: row.email_template_detail.subject,
          previewText: row.email_template_detail.previewText ?? "",
          htmlBody: row.email_template_detail.htmlBody,
          status: row.marketing_template.status as "draft" | "published",
        }}
      />
    </div>
  );
}
