"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEmailTemplate, updateEmailTemplate, deleteEmailTemplate } from "@/lib/actions/email-marketing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Save, Eye, Code, Info, Trash2 } from "lucide-react";

const STARTER_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{{subject}}</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f4f5; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; }
    .header { background: #18181b; padding: 32px 40px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
    .body { padding: 40px; color: #3f3f46; line-height: 1.6; }
    .body h2 { color: #18181b; }
    .btn { display: inline-block; padding: 12px 28px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .footer { padding: 24px 40px; text-align: center; font-size: 12px; color: #a1a1aa; border-top: 1px solid #f4f4f5; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>NinjazCRM</h1>
    </div>
    <div class="body">
      <h2>Hi {{firstName}},</h2>
      <p>Write your email content here. You can use variables like <strong>{{firstName}}</strong>, <strong>{{lastName}}</strong>, and <strong>{{email}}</strong>.</p>
      <p style="text-align:center; margin-top: 32px;">
        <a href="#" class="btn">Call to Action</a>
      </p>
    </div>
    <div class="footer">
      <p>You received this because you subscribed to our list.</p>
      <p><a href="#">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`;

type Props = {
  templateId?: string;
  defaultValues?: {
    name: string;
    subject: string;
    previewText: string;
    htmlBody: string;
    status: "draft" | "published";
  };
};

export function TemplateEditor({ templateId, defaultValues }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(defaultValues?.name ?? "");
  const [subject, setSubject] = useState(defaultValues?.subject ?? "");
  const [previewText, setPreviewText] = useState(defaultValues?.previewText ?? "");
  const [htmlBody, setHtmlBody] = useState(defaultValues?.htmlBody ?? STARTER_HTML);
  const [status, setStatus] = useState<"draft" | "published">(defaultValues?.status ?? "draft");
  const [error, setError] = useState("");

  function handleSave(saveStatus: "draft" | "published") {
    if (!name || !subject || !htmlBody) {
      setError("Name, subject and HTML body are required.");
      return;
    }
    setError("");
    startTransition(async () => {
      if (templateId) {
        await updateEmailTemplate(templateId, { name, subject, previewText, htmlBody, status: saveStatus });
        setStatus(saveStatus);
        router.refresh();
      } else {
        const id = await createEmailTemplate({ name, subject, previewText, htmlBody });
        router.push(`/marketing/email/templates/${id}`);
      }
    });
  }

  function handleDelete() {
    if (!templateId) return;
    startTransition(async () => {
      await deleteEmailTemplate(templateId);
      router.push("/marketing/email");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* HTML Editor */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Code className="size-4" />
                HTML Editor
              </CardTitle>
              <Badge variant={status === "published" ? "default" : "secondary"}>
                {status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <Info className="size-4" />
              <AlertDescription className="text-xs">
                Available variables: <code className="bg-muted px-1 rounded">{"{{firstName}}"}</code>{" "}
                <code className="bg-muted px-1 rounded">{"{{lastName}}"}</code>{" "}
                <code className="bg-muted px-1 rounded">{"{{email}}"}</code>
              </AlertDescription>
            </Alert>
            <Textarea
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              className="font-mono text-xs min-h-[520px] resize-y"
              placeholder="Paste your HTML here..."
              spellCheck={false}
            />
          </CardContent>
        </Card>
      </div>

      {/* Settings + Preview */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Welcome Email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Welcome to NinjazCRM, {{firstName}}!"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preview">Preview Text</Label>
              <Input
                id="preview"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="Short text shown in inbox preview..."
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleSave("draft")}
                disabled={isPending}
              >
                <Save className="size-4" />
                Save Draft
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleSave("published")}
                disabled={isPending}
              >
                Publish
              </Button>
            </div>
            {templateId && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive" disabled={isPending}>
                    <Trash2 className="size-3" />
                    Delete Template
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this template?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the template. Campaigns using it will not be affected.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardContent>
        </Card>

        {/* Live preview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Eye className="size-4" />
              Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-b-lg overflow-hidden border-t">
              <iframe
                srcDoc={htmlBody}
                className="w-full h-[400px]"
                title="Email Preview"
                sandbox="allow-same-origin"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
